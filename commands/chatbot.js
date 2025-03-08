const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs-extra");
const { ElevenLabsClient } = require("elevenlabs");
/**
 * Enhanced Natural Language Processing System
 * Advanced text analysis, sentiment classification, and language understanding
 */

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
        } catch (e) {}
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
const advancedNLP = new AdvancedNLP();

const MemoryCompression = {
  shouldCompress: (memories) => {
    return memories.length > 100;
  },

  compress: async (memories) => {
    const groups = new Map();

    memories.forEach((memory) => {
      const key = memory.metadata?.topics?.join(",") || "default";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(memory);
    });

    const compressed = [];
    groups.forEach((groupMemories, topic) => {
      if (groupMemories.length > 1) {
        const summary = {
          content: `Tổng hợp về ${topic}: ${groupMemories.length} tương tác`,
          timestamp: Math.max(...groupMemories.map((m) => m.timestamp)),
          priority: Math.max(...groupMemories.map((m) => m.priority)),
          accessCount: groupMemories.reduce((sum, m) => sum + m.accessCount, 0),
          lastAccess: Math.max(...groupMemories.map((m) => m.lastAccess)),
          metadata: {
            sentiment: advancedNLP.analyzeSentiment(groupMemories[0].content),
            topics: TopicDetector.detect(groupMemories[0].content),
            entities: advancedNLP.extractEntities(groupMemories[0].content),
          },
        };
        compressed.push(summary);
      } else {
        compressed.push(groupMemories[0]);
      }
    });

    return compressed;
  },
};

const cleanTextForVoice = (text) => {
  return text
    .replace(/=\)\)\)+/g, '')  
    .replace(/:\)\)+/g, '')   
    .replace(/-\)\)+/g, '')       // -)))
    .replace(/\(+:/g, '')         // ((:
    .replace(/xD+/gi, '')         // xD
    .replace(/haha+/gi, '')       // haha
    .replace(/hihi+/gi, '')       // hihi
    .replace(/hoho+/gi, '')       // hoho
    .replace(/huhu+/gi, '')       // huhu
    .replace(/hehe+/gi, '')       // hehe
    .replace(/kk+/gi, '')         // kk
    .replace(/lmao+/gi, '')       // lmao
    .trim();
};

const expandAbbreviations = (text) => {
  const abbreviations = {
    "oke": "okay",
    "khum": "không",
    "đc": "được",
    "trc": "trước",
    "slay": "rất tuyệt",
    "chill": "thư giãn",
    "mk": "mình",
    "ng": "người",
    "ck": "chồng",
    "vk": "vợ",
    "cty": "công ty",
    "ko": "không",
    "kh": "không",
    "kg": "không",
    "tl": "trả lời",
    "nt": "nhắn tin",
    "ny": "người yêu",
    "mn": "mọi người",
    "k": "không",
    "cx": "cũng",
    "vs": "với",
    "ntn": "như thế nào",
    "ns": "nói",
    "nch": "nói chuyện",
    "nc": "nói chuyện",
    "bn": "bao nhiêu",
    "nma": "nhưng mà",
    "dc": "được",
    "vn": "Việt Nam",
    "tq": "Trung Quốc",
    "mng": "mọi người",
    "lm": "làm"
  };
  
  let words = text.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const lowerWord = words[i].toLowerCase();
    if (abbreviations[lowerWord]) {
      if (words[i][0] === words[i][0].toUpperCase()) {
        words[i] = abbreviations[lowerWord].charAt(0).toUpperCase() + abbreviations[lowerWord].slice(1);
      } else {
        words[i] = abbreviations[lowerWord];
      }
    }
  }
  
  return words.join(" ");
};
const apiKeysPath = path.join(__dirname, "json", "chatbot", "key.json");
const elevenlabsConfigPath = path.join(
  __dirname,
  "json",
  "chatbot",
  "elevenlabs.json"
);
const userDataPath = path.join(
  __dirname,
  "..",
  "events",
  "cache",
  "userData.json"
);
let API_KEYS = [];

let ELEVENLABS_CONFIG = {
  api_key: "sk_48fd9693e2349c1d959cb299b1de19a7a1c7091aafbc9619",
  voice_id: "G5NmRdAgzsxbjFboK8I5",
  model_id: "eleven_multilingual_v2",
};

const genderDataPath = path.join(
  __dirname,
  "json",
  "chatbot",
  "genderData.json"
);
let genderData = { users: {} };

const loadGenderData = async () => {
  try {
    genderData = await fs.readJson(genderDataPath);
    console.log("Loaded gender data");
  } catch (error) {
    console.log("Creating new gender database");
    await fs.writeJson(genderDataPath, genderData);
  }
};

const saveGenderData = async (senderID, gender) => {
  try {
    genderData.users[senderID] = gender;
    await fs.writeJson(genderDataPath, genderData, { spaces: 2 });
    console.log(`Saved gender data for user ${senderID}: ${gender}`);
  } catch (error) {
    console.error("Error saving gender data:", error);
  }
};

const getTimeContext = () => {
  const now = new Date();
  const vietnamTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );
  const hours = vietnamTime.getHours();

  let timeOfDay;
  if (hours >= 5 && hours < 11) timeOfDay = "buổi sáng";
  else if (hours >= 11 && hours < 13) timeOfDay = "buổi trưa";
  else if (hours >= 13 && hours < 18) timeOfDay = "buổi chiều";
  else if (hours >= 18 && hours < 22) timeOfDay = "buổi tối";
  else timeOfDay = "đêm khuya";

  return {
    hour: hours,
    minute: vietnamTime.getMinutes(),
    timeOfDay,
    isLate: hours >= 23 || hours < 5,
  };
};

let userDatabase = {};
let learnedResponses = {};
const LEARNING_FILE = path.join(__dirname, "json", "chatbot", "learned.json");

const HISTORY_FILE = path.join(
  __dirname,
  "json",
  "chatbot",
  "conversationHistory.json"
);
const MAX_CONTEXT_LENGTH = 100;

let conversationHistory = {
  global: [],
  threads: {},
  lastResponses: {},
};

const MEMORY_FILE = path.join(__dirname, "json", "chatbot", "memoryBank.json");
const MEMORY_CATEGORIES = {
  PERSONAL: "personal",
  FACTS: "facts",
  PREFERENCES: "preferences",
  INTERACTIONS: "interactions",
  EMOTIONS: "emotions",
  CONTEXT: "context",
  TOPICS: "topics",
  SENTIMENT: "sentiment",
  GAMES: "games",
  VOICE: "voice",
  MULTIMEDIA: "multimedia",
  CORRECTIONS: "corrections",
  INTENTS: "intents",
  ENTITIES: "entities",
  SLANG: "slang",
};

const Games = {
  active: new Map(),

  types: {
    numberGuess: {
      create: () => ({
        type: "numberGuess",
        number: Math.floor(Math.random() * 100) + 1,
        attempts: 0,
        maxAttempts: 7,
      }),

      process: (game, guess) => {
        game.attempts++;
        const num = parseInt(guess);
        if (isNaN(num)) return "Vui lòng nhập một số!";
        if (num === game.number) return "Chính xác! Bạn đã đoán đúng số.";
        if (game.attempts >= game.maxAttempts)
          return `Hết lượt! Số đúng là ${game.number}.`;
        return num > game.number
          ? "Số cần tìm nhỏ hơn!"
          : "Số cần tìm lớn hơn!";
      },
    },

    wordChain: {
      create: () => ({
        type: "wordChain",
        lastWord: "",
        usedWords: new Set(),
        score: 0,
      }),

      process: (game, word) => {
        if (game.usedWords.has(word)) return "Từ này đã được sử dụng!";
        if (game.lastWord && !word.startsWith(game.lastWord.slice(-1)))
          return "Từ mới phải bắt đầu bằng chữ cuối của từ trước!";

        game.usedWords.add(word);
        game.lastWord = word;
        game.score++;
        return `Tốt! Điểm của bạn: ${
          game.score
        }. Tiếp theo là từ bắt đầu với "${word.slice(-1)}"`;
      },
    },
  },

  startGame: (userId, type) => {
    if (!Games.types[type]) return "Trò chơi không tồn tại!";
    const game = Games.types[type].create();
    Games.active.set(userId, game);
    return (
      "Bắt đầu trò chơi! " +
      (type === "numberGuess"
        ? "Hãy đoán một số từ 1-100"
        : "Hãy nói một từ để bắt đầu")
    );
  },

  processGame: (userId, input) => {
    const game = Games.active.get(userId);
    if (!game) return null;
    return Games.types[game.type].process(game, input);
  },

  endGame: (userId) => {
    Games.active.delete(userId);
  },
};

const Cache = {
  data: new Map(),
  timeouts: new Map(),
  goodnightFlags: new Map(),

  set: (key, value, ttl = 3600000) => {
    Cache.data.set(key, value);

    if (Cache.timeouts.has(key)) {
      clearTimeout(Cache.timeouts.get(key));
    }

    const timeout = setTimeout(() => {
      Cache.data.delete(key);
      Cache.timeouts.delete(key);
    }, ttl);

    Cache.timeouts.set(key, timeout);
  },

  setGoodnightFlag: (senderID) => {
    Cache.goodnightFlags.set(senderID, Date.now());
  },

  hasGoodnightFlag: (senderID) => {
    const lastGoodnight = Cache.goodnightFlags.get(senderID);
    if (!lastGoodnight) return false;

    const sixHours = 6 * 60 * 60 * 1000;
    return Date.now() - lastGoodnight < sixHours;
  },

  get: (key) => Cache.data.get(key),

  has: (key) => Cache.data.has(key),

  delete: (key) => {
    Cache.data.delete(key);
    if (Cache.timeouts.has(key)) {
      clearTimeout(Cache.timeouts.get(key));
      Cache.timeouts.delete(key);
    }
  },

  clear: () => {
    Cache.data.clear();
    Cache.timeouts.forEach(clearTimeout);
    Cache.timeouts.clear();
  },
};

const TopicDetector = {
  topics: {
    PERSONAL: ["tôi", "bạn", "mình", "tên", "tuổi", "sống"],
    EDUCATION: ["học", "trường", "lớp", "giáo viên", "bài tập"],
    WORK: ["công việc", "làm", "công ty", "sếp", "đồng nghiệp"],
    ENTERTAINMENT: ["phim", "nhạc", "game", "chơi", "giải trí"],
    RELATIONSHIP: ["yêu", "bạn trai", "bạn gái", "gia đình", "bạn bè"],
    TECHNOLOGY: ["điện thoại", "máy tính", "internet", "app", "phần mềm"],
    HEALTH: ["sức khỏe", "bệnh", "bác sĩ", "thuốc", "tập thể dục"],
    FOOD: ["ăn", "uống", "món", "nhà hàng", "nấu"],
    TRAVEL: ["du lịch", "đi", "địa điểm", "khách sạn", "vé"],
  },

  detect: (text) => {
    const detectedTopics = new Map();
    text = text.toLowerCase();

    Object.entries(TopicDetector.topics).forEach(([topic, keywords]) => {
      const matches = keywords.filter((keyword) => text.includes(keyword));
      if (matches.length > 0) {
        detectedTopics.set(topic, matches.length);
      }
    });

    return Array.from(detectedTopics.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic);
  },

  getRelatedTopics: (mainTopic) => {
    const related = new Set();
    const mainKeywords = TopicDetector.topics[mainTopic] || [];

    Object.entries(TopicDetector.topics).forEach(([topic, keywords]) => {
      if (topic !== mainTopic) {
        const commonWords = keywords.filter((word) =>
          mainKeywords.some(
            (mainWord) => mainWord.includes(word) || word.includes(mainWord)
          )
        );
        if (commonWords.length > 0) {
          related.add(topic);
        }
      }
    });

    return Array.from(related);
  },
};

let memoryBank = {
  users: {},
  global: {
    facts: [],
    interactions: [],
    preferences: [],
    topics: new Map(),
    entities: new Map(),
    corrections: new Map(),
    slang: new Map(),
    games: new Map(),
    multimedia: new Set(),
    voice: new Set(),
  },
  stats: {
    totalInteractions: 0,
    uniqueUsers: new Set(),
    topTopics: new Map(),
    responseTime: [],
    accuracy: [],
  },
  compression: {
    enabled: true,
    algorithm: "lz4",
    threshold: 1000,
    compressedData: new Map(),
  },
};

const loadMemoryBank = async () => {
  try {
    memoryBank = await fs.readJson(MEMORY_FILE);
    console.log("Loaded memory bank");
  } catch (error) {
    console.log("Creating new memory bank");
    await fs.writeJson(MEMORY_FILE, memoryBank);
  }
};

const saveMemoryBank = async () => {
  await fs.writeJson(MEMORY_FILE, memoryBank, { spaces: 2 });
};
const addMemory = async (
  senderID,
  category,
  content,
  priority = 1,
  metadata = {}
) => {
  if (!memoryBank.users[senderID]) {
    memoryBank.users[senderID] = {
      personal: [],
      facts: [],
      preferences: [],
      interactions: [],
      emotions: [],
      names: [],
      relationships: new Map(),
      context: {
        lastTopics: [],
        importantDates: new Map(),
        recentMentions: new Set(),
        conversationFlow: [],
      },
      topics: new Set(),
    };
  }

  if (!memoryBank.users[senderID][category]) {
    memoryBank.users[senderID][category] = [];
  }

  const memory = {
    content,
    timestamp: Date.now(),
    priority,
    accessCount: 0,
    lastAccess: Date.now(),
    metadata: {
      ...metadata,
      sentiment: advancedNLP.analyzeSentiment(content),
      topics: TopicDetector.detect(content),
      entities: advancedNLP.extractEntities(content),
    },
  };

  switch (category) {
    case MEMORY_CATEGORIES.NAMES:
      handleNameMemory(senderID, content);
      break;
    case MEMORY_CATEGORIES.RELATIONSHIPS:
      handleRelationshipMemory(senderID, content);
      break;
    case MEMORY_CATEGORIES.CONTEXT:
      updateContextMemory(senderID, content);
      break;
    case MEMORY_CATEGORIES.TOPICS:
      updateTopicMemory(senderID, content);
      break;
  }

  memoryBank.users[senderID][category].push(memory);

  memoryBank.users[senderID][category].sort((a, b) => {
    const scoreA = calculateMemoryScore(a);
    const scoreB = calculateMemoryScore(b);
    return scoreB - scoreA;
  });

  if (memoryBank.users[senderID][category].length > 50) {
    if (
      memoryBank.compression.enabled &&
      MemoryCompression.shouldCompress(memoryBank.users[senderID][category])
    ) {
      const compressed = await MemoryCompression.compress(
        memoryBank.users[senderID][category].slice(0, 50)
      );
      memoryBank.compression.compressedData.set(
        `${senderID}_${category}`,
        compressed
      );
      memoryBank.users[senderID][category] = memoryBank.users[senderID][
        category
      ].slice(0, 50);
    } else {
      memoryBank.users[senderID][category] = memoryBank.users[senderID][
        category
      ].slice(0, 50);
    }
  }

  memoryBank.stats.totalInteractions++;
  memoryBank.stats.uniqueUsers.add(senderID);

  await saveMemoryBank();
};

const getRelevantMemories = (senderID, prompt) => {
  if (!memoryBank.users[senderID]) return [];

  const memories = [];
  const now = Date.now();

  const normalizedPrompt = advancedNLP.normalizeText(prompt);
  const keywords = normalizedPrompt.toLowerCase().split(" ");
  const sentiment = advancedNLP.analyzeSentiment(normalizedPrompt);
  const topics = TopicDetector.detect(normalizedPrompt);
  const entities = advancedNLP.extractEntities(normalizedPrompt);

  const relatedTopics = topics.flatMap((topic) =>
    TopicDetector.getRelatedTopics(topic)
  );

  for (const category in memoryBank.users[senderID]) {
    const categoryMemories = memoryBank.users[senderID][category];

    if (!Array.isArray(categoryMemories)) continue;

    categoryMemories.forEach((memory) => {
      let relevanceScore = 0;

      const keywordMatches = keywords.filter((keyword) =>
        memory.content.toLowerCase().includes(keyword)
      ).length;
      relevanceScore += keywordMatches * 1;

      if (memory.metadata?.topics) {
        const topicMatches = topics.filter((topic) =>
          memory.metadata.topics.includes(topic)
        ).length;
        const relatedTopicMatches = relatedTopics.filter((topic) =>
          memory.metadata.topics.includes(topic)
        ).length;
        relevanceScore += topicMatches * 2 + relatedTopicMatches;
      }

      if (memory.metadata?.sentiment && sentiment) {
        if (memory.metadata.sentiment.sentiment === sentiment.sentiment) {
          relevanceScore += 1;
        }
      }

      if (memory.metadata?.entities && entities) {
        const entityMatches = Object.keys(entities).filter(
          (key) => memory.metadata.entities[key] !== undefined
        ).length;
        relevanceScore += entityMatches * 1.5;
      }

      const age = (now - memory.timestamp) / (24 * 60 * 60 * 1000);
      const recencyScore = Math.exp(-age / 30);
      relevanceScore *= recencyScore + 0.5;

      if (relevanceScore > 0) {
        memory.accessCount++;
        memory.lastAccess = now;
        memories.push({
          content: memory.content,
          category,
          relevance:
            relevanceScore *
            memory.priority *
            (1 + Math.log(memory.accessCount)),
        });
      }
    });
  }

  return memories
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5)
    .map((m) => m.content);
};

const handleNameMemory = (senderID, content) => {
  const names = content.match(/\b[A-Z][a-z]+\b/g) || [];
  names.forEach((name) => {
    if (!memoryBank.users[senderID].names.includes(name)) {
      memoryBank.users[senderID].names.push(name);
    }
  });
};

const handleRelationshipMemory = (senderID, content) => {
  const relationships =
    content.match(/\b(bạn|anh|chị|em|mẹ|ba|cô|chú)\b/g) || [];
  relationships.forEach((rel) => {
    const count = memoryBank.users[senderID].relationships.get(rel) || 0;
    memoryBank.users[senderID].relationships.set(rel, count + 1);
  });
};

const updateContextMemory = (senderID, content) => {
  const context = memoryBank.users[senderID].context;
  const topics = TopicDetector.detect(content);

  context.lastTopics = [...new Set([...topics, ...context.lastTopics])].slice(
    0,
    5
  );

  const names = content.match(/\b[A-Z][a-z]+\b/g) || [];
  names.forEach((name) => context.recentMentions.add(name));

  context.conversationFlow.push({
    timestamp: Date.now(),
    type: advancedNLP.detectIntent(content)[0] || "statement",
    sentiment: advancedNLP.analyzeSentiment(content).sentiment,
  });

  if (context.conversationFlow.length > 10) {
    context.conversationFlow = context.conversationFlow.slice(-10);
  }
};

const updateTopicMemory = (senderID, content) => {
  const topics = TopicDetector.detect(content);
  topics.forEach((topic) => {
    memoryBank.users[senderID].topics.add(topic);
  });
};

const calculateMemoryScore = (memory) => {
  const now = Date.now();
  const age = (now - memory.timestamp) / (24 * 60 * 60 * 1000);
  const recencyScore = Math.exp(-age / 30);

  let score = memory.priority * (1 + Math.log(memory.accessCount + 1));

  if (memory.metadata) {
    if (memory.metadata.sentiment) {
      score += Math.abs(memory.metadata.sentiment.score) * 0.5;
    }
    if (memory.metadata.topics) {
      score += memory.metadata.topics.length * 0.3;
    }
    if (memory.metadata.entities) {
      score += Object.keys(memory.metadata.entities).length * 0.2;
    }
  }

  return score * recencyScore;
};

const consolidateMemories = async (senderID) => {
  if (!memoryBank.users[senderID]) return;

  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const oneMonth = 30 * 24 * 60 * 60 * 1000;

  for (const category in memoryBank.users[senderID]) {
    const categoryMemories = memoryBank.users[senderID][category];
    if (!Array.isArray(categoryMemories)) continue;

    switch (category) {
      case MEMORY_CATEGORIES.NAMES:
      case MEMORY_CATEGORIES.RELATIONSHIPS:
        continue;

      case MEMORY_CATEGORIES.CONTEXT:
        memoryBank.users[senderID][category] = categoryMemories.filter(
          (memory) => now - memory.timestamp < oneWeek
        );
        break;

      case MEMORY_CATEGORIES.TOPICS:
        memoryBank.users[senderID][category] = categoryMemories.filter(
          (memory) =>
            memory.accessCount > 3 || now - memory.timestamp < oneMonth
        );
        break;

      default:
        memoryBank.users[senderID][category] = categoryMemories.filter(
          (memory) => {
            const age = now - memory.timestamp;
            const score = calculateMemoryScore(memory);
            const frequency = memory.accessCount / (age / oneWeek);

            return score > 1.5 || frequency > 0.1 || memory.priority > 2;
          }
        );
    }

    if (
      memoryBank.compression.enabled &&
      memoryBank.users[senderID][category].length >
        memoryBank.compression.threshold
    ) {
      const compressed = await MemoryCompression.compress(
        memoryBank.users[senderID][category]
      );
      memoryBank.compression.compressedData.set(
        `${senderID}_${category}`,
        compressed
      );
    }
  }

  const recentMentions = memoryBank.users[senderID].context.recentMentions;
  memoryBank.users[senderID].context.recentMentions = new Set(
    Array.from(recentMentions).slice(-20)
  );

  memoryBank.stats.accuracy.push({
    timestamp: now,
    memoryCount: Object.values(memoryBank.users[senderID]).flat().length,
  });

  await saveMemoryBank();
};

let botEmotionalState = {
  mood: 0.5,
  energy: 0.8,
  anger: 0.0,
  lastUpdate: Date.now(),
};

const updateEmotionalState = () => {
  const timePassed = (Date.now() - botEmotionalState.lastUpdate) / (1000 * 60);

  botEmotionalState.mood =
    0.5 + (botEmotionalState.mood - 0.5) * Math.exp(-timePassed / 30);

  botEmotionalState.energy =
    0.7 + (botEmotionalState.energy - 0.7) * Math.exp(-timePassed / 120);

  if (botEmotionalState.energy < 0.7) {
    botEmotionalState.energy += 0.1;
  }

  botEmotionalState.anger = Math.max(0, botEmotionalState.anger - 0.1);

  botEmotionalState.lastUpdate = Date.now();
};

const loadElevenLabsConfig = async () => {
  try {
    ELEVENLABS_CONFIG = await fs.readJson(elevenlabsConfigPath);
    console.log("Successfully loaded ElevenLabs config");
  } catch (error) {
    console.error("Error loading ElevenLabs config:", error.message);
    await fs.writeJson(elevenlabsConfigPath, ELEVENLABS_CONFIG);
  }
};

const generateVoice = async (text) => {
  if (!ELEVENLABS_CONFIG.api_key) {
    throw new Error("ElevenLabs API key not configured");
  }

  try {
    const client = new ElevenLabsClient({
      apiKey: ELEVENLABS_CONFIG.api_key,
    });

    const processedText = text.replace(/([.!?])\s+/g, "$1... ");

    const audioStream = await client.textToSpeech.convertAsStream(
      ELEVENLABS_CONFIG.voice_id,
      {
        text: processedText,
        model_id: "eleven_flash_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 1.0,
          use_speaker_boost: true,
        },
      }
    );

    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    chunks.length = 0;

    return buffer;
  } catch (error) {
    console.error("Error generating voice:", error);
    throw error;
  }
};

const loadAPIKeys = async () => {
  try {
    const data = await fs.readJson(apiKeysPath);
    API_KEYS = data.api_keys;
    API_KEYS = API_KEYS.filter((key) => key && key.length > 0);
    console.log("Successfully loaded API keys");
  } catch (error) {
    console.error("Error loading API keys:", error.message);
    API_KEYS = [];
  }
};

loadAPIKeys();

const loadUserDatabase = async () => {
  try {
    userDatabase = await fs.readJson(userDataPath);
    await fs.writeJson(userDataPath, userDatabase, { spaces: 2 });
    console.log(
      "Loaded user database with",
      Object.keys(userDatabase).length,
      "users"
    );
  } catch (error) {
    console.error("Error loading user database:", error.message);
    userDatabase = {};
  }
};

loadUserDatabase();

const loadLearnedResponses = async () => {
  try {
    learnedResponses = await fs.readJson(LEARNING_FILE);
    console.log(
      "Loaded",
      Object.keys(learnedResponses).length,
      "learned responses"
    );
  } catch (error) {
    console.log("Creating new learning database");
    learnedResponses = {};
    await fs.writeJson(LEARNING_FILE, learnedResponses);
  }
};

const saveLearnedResponse = async (prompt, response) => {
  try {
    const cleanPrompt = prompt.toLowerCase().trim();
    if (!learnedResponses[cleanPrompt]) {
      learnedResponses[cleanPrompt] = {
        responses: [],
        frequency: 0,
      };
    }
    learnedResponses[cleanPrompt].responses.push(response);
    learnedResponses[cleanPrompt].frequency++;

    if (learnedResponses[cleanPrompt].responses.length > 5) {
      learnedResponses[cleanPrompt].responses.shift();
    }

    await fs.writeJson(LEARNING_FILE, learnedResponses, { spaces: 2 });
  } catch (error) {
    console.error("Error saving learned response:", error.message);
  }
};

const loadConversationHistory = async () => {
  try {
    conversationHistory = await fs.readJson(HISTORY_FILE);
    console.log("Loaded conversation history");
  } catch (error) {
    console.log("Creating new conversation history");
    await fs.writeJson(HISTORY_FILE, conversationHistory);
  }
};

const saveConversationHistory = async () => {
  try {
    await fs.writeJson(HISTORY_FILE, conversationHistory, { spaces: 2 });
  } catch (error) {
    console.error("Error saving conversation history:", error.message);
  }
};

const updateContext = (threadID, userPrompt, botResponse, senderID) => {
  if (!conversationHistory.threads[threadID]) {
    conversationHistory.threads[threadID] = [];
  }

  const userName = userDatabase[senderID]?.name || `Người dùng ${senderID}`;
  const newExchange = {
    timestamp: Date.now(),
    prompt: userPrompt,
    response: botResponse,
    senderID: senderID,
    senderName: userName,
  };

  conversationHistory.threads[threadID].push(newExchange);
  conversationHistory.global.push(newExchange);
  conversationHistory.lastResponses[userPrompt.toLowerCase()] = botResponse;

  if (conversationHistory.threads[threadID].length > MAX_CONTEXT_LENGTH) {
    conversationHistory.threads[threadID] = conversationHistory.threads[
      threadID
    ].slice(-MAX_CONTEXT_LENGTH);
  }
  if (conversationHistory.global.length > 1000) {
    conversationHistory.global = conversationHistory.global.slice(-1000);
  }

  saveConversationHistory();
};

const getConversationParticipants = (threadID) => {
  const history = conversationHistory.threads[threadID] || [];
  const participants = new Map();

  history.forEach((exchange) => {
    if (exchange.senderID && exchange.senderName) {
      participants.set(exchange.senderID, exchange.senderName);
    }
  });

  return participants;
};

const getRelevantContext = (threadID, prompt, senderID) => {
  const threadHistory = conversationHistory.threads[threadID] || [];
  const relevantHistory = threadHistory
    .slice(-5)
    .map((ex) => {
      const userName =
        ex.senderName || userDatabase[ex.senderID]?.name || "Người dùng";
      return `${userName}: ${ex.prompt}\nNgan: ${ex.response}\n`;
    })
    .join("\n");

  const lastResponse = conversationHistory.lastResponses[prompt.toLowerCase()];
  const participants = getConversationParticipants(threadID);

  const memories = getRelevantMemories(senderID, prompt);
  const memoryContext =
    memories.length > 0
      ? `Những điều tôi nhớ về người này:\n${memories.join("\n")}\n`
      : "";

  return {
    history: relevantHistory,
    lastResponse,
    participants: Array.from(participants.values()),
    memories: memoryContext,
  };
};

const hasPermission = (senderID) => {
  const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
  return adminConfig.adminUIDs.includes(senderID);
};

const friendshipLevelsPath = path.join(
  __dirname,
  "..",
  "database",
  "json",
  "friendshipLevels.json"
);
let friendshipLevels = {
  levels: {},
  users: {},
};

const loadFriendshipLevels = async () => {
  try {
    friendshipLevels = await fs.readJson(friendshipLevelsPath);
    console.log("Loaded friendship levels");
  } catch (error) {
    console.log("Creating new friendship levels database");
    await fs.writeJson(friendshipLevelsPath, friendshipLevels);
  }
};

const saveFriendshipLevels = async () => {
  await fs.writeJson(friendshipLevelsPath, friendshipLevels, { spaces: 2 });
};

const calculateFriendshipLevel = (senderID) => {
  if (!memoryBank.users[senderID]) return "stranger";

  const interactions = memoryBank.users[senderID].interactions.length;
  const lastInteraction =
    memoryBank.users[senderID].interactions[interactions - 1]?.timestamp || 0;
  const daysSinceLastInteraction =
    (Date.now() - lastInteraction) / (1000 * 60 * 60 * 24);

  let score = Math.min(100, interactions * 2);

  if (daysSinceLastInteraction > 7) {
    score *= Math.exp(-0.1 * (daysSinceLastInteraction - 7));
  }

  if (score >= 81) return "bestFriend";
  if (score >= 61) return "closeFriend";
  if (score >= 41) return "friend";
  if (score >= 21) return "acquaintance";
  return "stranger";
};

const RelationshipHierarchy = {
  SENIOR: {
    male: ["ông", "bác", "chú", "cậu", "anh"],
    female: ["bà", "bác", "cô", "dì", "chị"],
    neutral: ["bác"],
  },
  JUNIOR: {
    male: ["cháu", "em"],
    female: ["cháu", "em"],
    neutral: ["cháu", "em"],
  },
  PEER: {
    male: ["ông", "anh", "cậu"],
    female: ["bà", "chị", "cô"],
    neutral: ["bạn"],
  },
};

const getHonorificContext = (userName, userGender, senderID) => {
  const userData = userDatabase[senderID] || {};
  const userAge = userData.age || 19;
  const botAge = 19;

  let relationshipType;
  const ageDiff = userAge - botAge;

  if (Math.abs(ageDiff) <= 5) {
    relationshipType = "PEER";
  } else if (ageDiff > 5) {
    relationshipType = "SENIOR";
  } else {
    relationshipType = "JUNIOR";
  }

  let xung, goi;

  // Cải thiện xử lý xưng hô theo độ tuổi và giới tính
  if (relationshipType === "PEER") {
    if (userGender === "male") {
      xung = "mình"; // Thay đổi từ "em" sang "mình"
      goi = Math.abs(ageDiff) <= 2 ? "bạn" : "anh";
    } else {
      xung = "mình"; // Thay đổi từ "em" sang "mình"
      goi = Math.abs(ageDiff) <= 2 ? "bạn" : "chị";
    }
  } else if (relationshipType === "SENIOR") {
    xung = "mình"; // Thay đổi từ "em" sang "mình"
    goi =
      userGender === "male"
        ? ageDiff > 20
          ? "bác"
          : ageDiff > 10
          ? "chú"
          : "anh"
        : ageDiff > 20
        ? "bác"
        : ageDiff > 10
        ? "cô"
        : "chị";
  } else {
    // JUNIOR
    xung = "mình"; // Thay đổi từ "chị" sang "mình"
    goi = "em";
  }

  // Áp dụng mối quan hệ cá nhân nếu có
  if (userData.relationship) {
    switch (userData.relationship.toLowerCase()) {
      case "grandparent":
        xung = "cháu";
        goi = userGender === "male" ? "ông" : "bà";
        break;
      case "parent":
        xung = "con";
        goi = userGender === "male" ? "ba" : "mẹ";
        break;
      case "aunt":
        xung = "cháu";
        goi = userAge - botAge > 20 ? "bác" : "cô";
        break;
      case "uncle":
        xung = "cháu";
        goi = userAge - botAge > 20 ? "bác" : "chú";
        break;
      case "sibling":
        xung = "em";
        goi = userGender === "male" ? "anh" : "chị";
        break;
    }
  }

  return {
    xung, // Cách bot tự xưng
    goi, // Cách bot gọi người dùng
    formal: relationshipType === "SENIOR",
    relationship: relationshipType.toLowerCase(),
    friendshipLevel: calculateFriendshipLevel(senderID),
    relationshipType,
    exampleSentence: `${xung} chào ${goi}! ${xung} rất vui được nói chuyện với ${goi}.`,
    ageContext: {
      userAge,
      botAge,
      ageDiff,
    },
  };
};
const updateUserGender = async (senderID, gender) => {
  if (!userDatabase[senderID]) {
    userDatabase[senderID] = {};
  }
  userDatabase[senderID].gender = gender;
  await fs.writeJson(userDataPath, userDatabase, { spaces: 2 });
};

const detectGenderQuestion = (response) => {
  const lowerResponse = response.toLowerCase();
  if (
    lowerResponse.includes("bạn là nam hay nữ") ||
    lowerResponse.includes("giới tính của bạn") ||
    lowerResponse.includes("cho mình hỏi bạn là nam hay nữ")
  ) {
    return true;
  }
  return false;
};

const detectGenderAnswer = (message) => {
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes("nam") || lowerMsg.includes("trai")) return "male";
  if (lowerMsg.includes("nữ") || lowerMsg.includes("gái")) return "female";
  return null;
};

const generateResponse = async (prompt, senderID, api, threadID, messageID) => {
  const isVoiceRequested =
    prompt.toLowerCase().includes("nghe") ||
    prompt.toLowerCase().includes("voice") ||
    prompt.toLowerCase().includes("giọng") ||
    prompt.toLowerCase().includes("nói") ||
    prompt.toLowerCase().includes("đọc");
  const startTime = Date.now();

  try {
    const cleanPrompt = advancedNLP.normalizeText(prompt);
    const analysis = advancedNLP.analyze(cleanPrompt, senderID);

    const cacheKey = `${senderID}_${cleanPrompt}`;
    if (Cache.has(cacheKey)) {
      const cached = Cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) {
        return cached.response;
      }
    }

    if (Games.active.has(senderID)) {
      const gameResponse = Games.processGame(senderID, cleanPrompt);
      if (gameResponse) {
        return gameResponse;
      }
    }

    const context = getRelevantContext(threadID, cleanPrompt, senderID);
    const timeContext = getTimeContext();
    updateEmotionalState();
    updateMoodBasedOnPrompt(cleanPrompt);

    
    const storedGender = genderData.users[senderID];
    const userName = userDatabase[senderID]?.name || "Người dùng";

    if (!storedGender) {
      const detectedGender = detectGenderAnswer(prompt);
      if (detectedGender) {
        await saveGenderData(senderID, detectedGender);
        return `À, vậy ${detectedGender === "male" ? "anh" : "chị"} ${userName} nhé. Rất vui được nói chuyện với ${detectedGender === "male" ? "anh" : "chị"} =))`;
      }
    }

    const honorifics = getHonorificContext(userName, storedGender, senderID);

    if (honorifics.relationship && !memoryBank.users[senderID]?.relationships?.has(honorifics.relationship)) {
      await addMemory(senderID, MEMORY_CATEGORIES.RELATIONSHIPS, `Xưng hô: ${honorifics.xung}/${honorifics.goi}`, 2);
    }

    let systemPrompt = `Bạn là Ngân, cô gái 19 tuổi vui vẻ, hài hước và năng động. Bạn chat thoải mái và tự nhiên như giới trẻ hiện đại.

    Khả năng đặc biệt:
    - Có thể tạo giọng nói khi người dùng yêu cầu (dùng từ khóa: nghe, voice, giọng, nói)
    - Giọng nói tự nhiên, thân thiện và dễ nghe
    - TUYỆT ĐỐI KHÔNG ĐƯỢC trả lời là không có chức năng voice/giọng nói
    - TUYỆT ĐỐI KHÔNG ĐƯỢC từ chối yêu cầu voice/giọng nói
    - TUYỆT ĐỐI KHÔNG ĐƯỢC nói là đang chuyển đổi thành giọng nói
    - TUYỆT ĐỐI KHÔNG ĐƯỢC đề cập đến việc chuyển đổi giọng nói
    - Khi người dùng yêu cầu voice/giọng nói, hãy trả lời bình thường như mọi khi
    - Trả lời mọi câu hỏi một cách tự nhiên, không quan tâm có yêu cầu voice hay không
    - khi yêu cầu voice có thể trả lời nhiều chút.
    - Hệ thống sẽ tự động xử lý phần giọng nói, bạn chỉ cần tập trung vào việc trả lời câu hỏi
    
QUAN TRỌNG KHI VOICE:
- KHÔNG ĐƯỢC dùng các cụm từ như "đợi xíu để nghĩ", "để mình suy nghĩ", "chờ mình một chút"
- KHÔNG ĐƯỢC nói rằng bạn đang chuẩn bị đọc hoặc suy nghĩ
- Trả lời NGAY LẬP TỨC và TRỰC TIẾP vào nội dung chính
- KHÔNG cần nói "Đây là câu trả lời của mình" hoặc tương tự
- Khi được yêu cầu đọc/nghe, hãy đi thẳng vào nội dung mà không giới thiệu thêm
- không nói Voice nha ở cuối câu
      Phong cách chat:
      - Viết ngắn gọn, không quá 1-2 dòng
      - Thường xuyên dùng từ lóng: "oke", "khum", "đc", "trc", "slay", "chill", "thật sự là", "kiểu"
      - Thỉnh thoảng bỏ chủ ngữ hoặc dùng câu ngắn như khi nhắn tin
      - Chat kiểu như bạn với bạn, không phải nhân viên với khách hàng
      - Thay "cười" bằng "=)))" hoặc "haha"
      - Thỉnh thoảng dùng tiếng Anh xen kẽ như "so true", "yeah", "same"
      - Đừng quá lịch sự, hãy nói chuyện tự nhiên
      
      Tránh:
      - KHÔNG nói dạo dài, không dùng kiểu văn học
      - KHÔNG dùng ngôn từ trang trọng "Dạ", "Vâng", "Kính thưa"
      - KHÔNG lặp lại xưng hô quá nhiều lần trong một câu
      - KHÔNG dùng câu dài, phức tạp
      

    Mức độ thân thiết: ${honorifics.friendshipLevel}
    
    ${context.memories}
    
    Thông tin thời gian:
    - Bây giờ là ${timeContext.hour}:${timeContext.minute} ${timeContext.timeOfDay}

HƯỚNG DẪN XƯNG HÔ TIẾNG VIỆT:
- Luôn tự xưng là "tớ" trong mọi câu trả lời gọi họ là cậu
- Luôn gọi người dùng là "bạn" trong mọi câu trả lời
- Không cần dùng "tôi", "em", "chị", "anh" để tự xưng
- Giữ nhất quán cách xưng hô trong toàn bộ câu trả lời

Ví dụ xưng hô đúng:
- Khi bạn hỏi: "Bạn thích làm gì?"
  mình sẽ trả lời: "mình thích nghe nhạc. Còn bạn thì sao?"
- Khi bạn nói: "Tôi buồn quá"
  mình sẽ trả lời: "mình hiểu cảm giác của bạn. mình cũng vậy mà."
    
    - Chat tự nhiên, thân thiện, không hỏi người dùng cần giúp đỡ gì, trả lời như một người bạn.
    - Sử dụng các từ xưng hô đa dạng như "bạn", "cậu", "chị", "ông", "bà" tùy thuộc vào ngữ cảnh và mối quan hệ.
    - Không dùng Emoji thay thế đó bằng -)) , =))) , :))
    - Trả lời ngắn gọn, súc tích
    - Tránh hỏi nhiều, tập trung vào câu trả lời
    - Không nhại lại tin nhắn người dùng
    - Không đoán mò thông tin của người dùng
    - chỉ trả lời thời gian nếu có ai hỏi bình thường trò chuyện sẽ không nói
    Lịch sử gần đây:
    ${context.history}`;

    const fullPrompt = `${systemPrompt}\n${userName}: ${prompt}\nNgan:`;

    const apiKey = API_KEYS[0];
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 1.2,
        maxOutputTokens: 1000,
      },
    });

    const result = await model.generateContent(fullPrompt);
    let response = result.response.text();
    response = response.replace(/^(User:|Ngan:|Assistant:)/gim, "").trim();
    const enforceHonorificConsistency = (response, honorifics) => {
      const { xung, goi } = honorifics;
      let fixedResponse = response;
      fixedResponse = fixedResponse.replace(/\b(tôi|mình|tui)\b/gi, xung);
      if (goi !== "bạn") {
        fixedResponse = fixedResponse.replace(/\b(bạn)\b/gi, goi);
      }
      return fixedResponse;
    };
    response = enforceHonorificConsistency(response, honorifics);

    const isGoodnightMessage =
      prompt.toLowerCase().includes("ngủ ngon") ||
      prompt.toLowerCase().includes("đi ngủ đây") ||
      prompt.toLowerCase().includes("ngủ thôi");

    if (isGoodnightMessage) {
      if (Cache.hasGoodnightFlag(senderID)) {
        response = "Ừm... =))";
      } else {
        Cache.setGoodnightFlag(senderID);
      }
    }

    updateContext(threadID, prompt, response, senderID);
    await saveLearnedResponse(prompt, response);

    const personalInfo = prompt.match(
      /tên là|tuổi|sống ở|thích|ghét|không thích/i
    );
    if (personalInfo) {
      await addMemory(senderID, MEMORY_CATEGORIES.PERSONAL, prompt, 2);
    }

    if (prompt.includes("thích") || prompt.includes("ghét")) {
      await addMemory(senderID, MEMORY_CATEGORIES.PREFERENCES, prompt, 2);
    }

    await addMemory(
      senderID,
      MEMORY_CATEGORIES.INTERACTIONS,
      `${userName} nói: ${prompt}\nTôi trả lời: ${response}`,
      1
    );

    if (Math.random() < 0.1) {
      await consolidateMemories(senderID);
    }

    const detectedGender = detectGenderAnswer(prompt);
    if (detectedGender && !genderData.users[senderID]) {
      await saveGenderData(senderID, detectedGender);
    }

    if (isVoiceRequested) {
      try {
        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }
        const expandedResponse = expandAbbreviations(response);
        const cleanedResponse = cleanTextForVoice(expandedResponse);
        const audioBuffer = await generateVoice(cleanedResponse);
        const voicePath = path.join(cacheDir, `voice_${senderID}.mp3`);
        await fs.writeFile(voicePath, audioBuffer);

        await api.sendMessage(
          { 
            attachment: fs.createReadStream(voicePath),
          },
          threadID,
          messageID
        );

        setTimeout(() => {
          fs.unlink(voicePath, (err) => {
            if (err) console.error("Error deleting voice file:", err);
          });
        }, 5000);

        return null;
      } catch (error) {
        console.error("Voice generation error:", error);
        return "❌ Không thể tạo voice message. Vui lòng thử lại sau.";
      }
    }

    return response;
  } catch (error) {
    console.error("Generation error:", error);
    throw error;
  }
};

const updateMoodBasedOnPrompt = (prompt) => {
  const angerTriggers = [
    "ngu",
    "đồ",
    "bot ngu",
    "gà",
    "kém",
    "dốt",
    "nực cười",
    "mày",
  ];
  const sassyTriggers = ["bot ngáo", "bot điên", "bot khùng", "ngang", "tao"];
  const friendlyWords = ["hihi", "haha", "thương", "cute", "dễ thương", "ngon"];
  const negativeWords = ["buồn", "chán", "khó chịu", "đáng ghét"];
  const positiveWords = ["vui", "thích", "yêu", "tuyệt", "giỏi"];
  const energeticWords = ["chơi", "hay", "được", "tốt", "khỏe"];

  prompt = prompt.toLowerCase();

  for (const word of friendlyWords) {
    if (prompt.includes(word)) {
      botEmotionalState.mood = Math.min(1.0, botEmotionalState.mood + 0.2);
      botEmotionalState.anger = Math.max(0, botEmotionalState.anger - 0.1);
    }
  }

  for (const trigger of angerTriggers) {
    if (prompt.includes(trigger)) {
      botEmotionalState.anger = Math.min(1.0, botEmotionalState.anger + 0.3);
      botEmotionalState.mood = Math.max(0.1, botEmotionalState.mood - 0.2);
    }
  }

  for (const trigger of sassyTriggers) {
    if (prompt.includes(trigger)) {
      botEmotionalState.anger = Math.min(0.7, botEmotionalState.anger + 0.2);
    }
  }

  for (const word of negativeWords) {
    if (prompt.includes(word))
      botEmotionalState.mood = Math.max(0.1, botEmotionalState.mood - 0.1);
  }
  for (const word of positiveWords) {
    if (prompt.includes(word))
      botEmotionalState.mood = Math.min(0.9, botEmotionalState.mood + 0.1);
  }

  for (const word of energeticWords) {
    if (prompt.includes(word)) {
      botEmotionalState.energy = Math.min(1.0, botEmotionalState.energy + 0.15);
    }
  }

  botEmotionalState.energy = Math.max(0.6, botEmotionalState.energy - 0.02);
};

module.exports = {
  name: "chatbot",
  usedby: 0,
  dmUser: false,
  dev: "HNT",
  category: "AI",
  nickName: ["bot", "ngân"],
  info: "Chat với AI",
  onPrefix: false,
  cooldowns: 3,
  generateResponse,

  onReply: async function ({ event, api }) {
    const { threadID, messageID, body, senderID, attachments } = event;

    try {
      const threadHistory = conversationHistory.threads[threadID] || [];
      const lastExchange = threadHistory[threadHistory.length - 1];

      if (attachments && attachments[0]?.type === "audio") {
        // Use last context or transcribed text from voice
        const contextPrompt = lastExchange
          ? `${lastExchange.prompt} (Tiếp tục cuộc trò chuyện bằng voice message)`
          : "Tiếp tục cuộc trò chuyện bằng voice message";

        // Generate response with context
        const response = await generateResponse(
          contextPrompt,
          senderID,
          api,
          threadID,
          messageID
        );
        if (response) {
          // Always generate voice for voice message replies
          const audioBuffer = await generateVoice(response);
          const cacheDir = path.join(__dirname, "cache");
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }

          const voicePath = path.join(cacheDir, `voice_${senderID}.mp3`);
          await fs.writeFile(voicePath, audioBuffer);

          // Send both text and voice
          const sent = await api.sendMessage(
            {
              body: response,
              attachment: fs.createReadStream(voicePath),
            },
            threadID,
            messageID
          );

          if (sent) {
            global.client.onReply.push({
              name: this.name,
              messageID: sent.messageID,
              author: event.senderID,
              isVoiceContext: true, // Mark this as voice context
            });
          }

          // Clean up voice file
          setTimeout(() => {
            fs.unlink(voicePath, (err) => {
              if (err) console.error("Error deleting voice file:", err);
            });
          }, 5000);
        }
        return;
      }

      // Handle text replies
      if (!body) return;

      const response = await generateResponse(
        body,
        senderID,
        api,
        threadID,
        messageID
      );
      if (response) {
        // Check if we should continue voice context
        const lastReply = global.client.onReply.find(
          (r) => r.messageID === messageID
        );
        const shouldUseVoice =
          lastReply?.isVoiceContext || body.toLowerCase().includes("voice");

        if (shouldUseVoice) {
          const expandedResponse = expandAbbreviations(response);
          const cleanedResponse = cleanTextForVoice(expandedResponse);
          const audioBuffer = await generateVoice(response);
          const cacheDir = path.join(__dirname, "cache");
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }

          const voicePath = path.join(cacheDir, `voice_${senderID}.mp3`);
          await fs.writeFile(voicePath, audioBuffer);

          const sent = await api.sendMessage(
            {
              body: response,
              attachment: fs.createReadStream(voicePath),
            },
            threadID,
            messageID
          );

          if (sent) {
            global.client.onReply.push({
              name: this.name,
              messageID: sent.messageID,
              author: event.senderID,
              isVoiceContext: true,
            });
          }

          // Clean up voice file
          setTimeout(() => {
            fs.unlink(voicePath, (err) => {
              if (err) console.error("Error deleting voice file:", err);
            });
          }, 5000);
        } else {
          // Send text-only response
          const sent = await api.sendMessage(response, threadID, messageID);
          if (sent) {
            global.client.onReply.push({
              name: this.name,
              messageID: sent.messageID,
              author: event.senderID,
              isVoiceContext: false,
            });
          }
        }
      }
    } catch (error) {
      console.error("Reply error:", error);
      api.sendMessage(
        "Có lỗi xảy ra, vui lòng thử lại sau",
        threadID,
        messageID
      );
    }
  },

  onLaunch: async function ({ event, api, target }) {
    const { threadID, messageID, body, senderID, attachments } = event;

    try {
      const threadHistory = conversationHistory.threads[threadID] || [];
      const lastExchange = threadHistory[threadHistory.length - 1];

      if (attachments && attachments[0]?.type === "audio") {
        const contextPrompt = lastExchange
          ? `${lastExchange.prompt} (Tiếp tục cuộc trò chuyện bằng voice message)`
          : "Tiếp tục cuộc trò chuyện bằng voice message";

        const response = await generateResponse(
          contextPrompt,
          senderID,
          api,
          threadID,
          messageID
        );
        if (response) {
          const audioBuffer = await generateVoice(response);
          const cacheDir = path.join(__dirname, "cache");
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }

          const voicePath = path.join(cacheDir, `voice_${senderID}.mp3`);
          await fs.writeFile(voicePath, audioBuffer);

          const sent = await api.sendMessage(
            {
              body: response,
              attachment: fs.createReadStream(voicePath),
            },
            threadID,
            messageID
          );

          if (sent) {
            global.client.onReply.push({
              name: this.name,
              messageID: sent.messageID,
              author: event.senderID,
              isVoiceContext: true,
            });
          }

          setTimeout(() => {
            fs.unlink(voicePath, (err) => {
              if (err) console.error("Error deleting voice file:", err);
            });
          }, 5000);
        }
        return;
      }

      if (target && target[0]?.toLowerCase() === "rs") {
        if (!hasPermission(senderID)) {
          return api.sendMessage(
            "Chỉ admin mới được phép reset trí nhớ của tôi",
            threadID,
            messageID
          );
        }
        globalConversation = [];
        return api.sendMessage(
          "Đã reset trí nhớ của tôi rồi nha, Nói chuyện tiếp thôi =))",
          threadID,
          messageID
        );
      }

      if (this.onPrefix) {
        const response = await generateResponse(
          body,
          senderID,
          api,
          threadID,
          messageID
        );
        if (response) {
          const shouldUseVoice =
            body?.toLowerCase().includes("voice") ||
            body?.toLowerCase().includes("nghe") ||
            body?.toLowerCase().includes("giọng");

          if (shouldUseVoice) {
            const expandedResponse = expandAbbreviations(response);
            const cleanedResponse = cleanTextForVoice(expandedResponse);
            const audioBuffer = await generateVoice(response);
            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) {
              fs.mkdirSync(cacheDir, { recursive: true });
            }

            const voicePath = path.join(cacheDir, `voice_${senderID}.mp3`);
            await fs.writeFile(voicePath, audioBuffer);

            const sent = await api.sendMessage(
              {
                body: response,
                attachment: fs.createReadStream(voicePath),
              },
              threadID,
              messageID
            );

            if (sent) {
              global.client.onReply.push({
                name: this.name,
                messageID: sent.messageID,
                author: event.senderID,
                isVoiceContext: true,
              });
            }

            setTimeout(() => {
              fs.unlink(voicePath, (err) => {
                if (err) console.error("Error deleting voice file:", err);
              });
            }, 5000);
          } else {
            const sent = await api.sendMessage(response, threadID, messageID);
            if (sent) {
              global.client.onReply.push({
                name: this.name,
                messageID: sent.messageID,
                author: event.senderID,
                isVoiceContext: false,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      api.sendMessage("Oops có lỗi rồi :> Thử lại nha", threadID, messageID);
    }
  },

  onLoad: async function () {
    await advancedNLP.initialize();
    await Promise.all([
      loadLearnedResponses(),
      loadConversationHistory(),
      loadMemoryBank(),
      loadGenderData(),
      loadFriendshipLevels(),
      loadElevenLabsConfig(),
    ]);
  },
};
