const { GoogleGenerativeAI, Part } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs-extra");
const { ElevenLabsClient } = require("elevenlabs");
const advancedNLP = require('./models/NLP');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const ResponseCooldown = {
  lastResponses: new Map(),
  isTyping: new Map(),
  
  getTypingDelay: (message) => {
    // Calculate natural typing delay based on message length and complexity
    const baseDelay = 1500; // Base thinking time in ms
    const typingSpeed = 50; // ms per character (average human typing speed)
    const complexity = message.includes('?') ? 1.2 : 1; // Questions take longer to process
    
    // Longer messages need more "thinking time"
    const thinkingTime = Math.min(baseDelay + (message.length / 5) * 300, 5000);
    
    // Reading + thinking + typing time
    return thinkingTime + (message.length * typingSpeed * complexity);
  },
  
  getResponseDelay: (senderID, threadID, message) => {
    const now = Date.now();
    const lastResponse = ResponseCooldown.lastResponses.get(`${threadID}_${senderID}`);
    
    // If already typing, don't calculate again
    if (ResponseCooldown.isTyping.get(`${threadID}_${senderID}`)) {
      return 0;
    }
    
    // Short messages get shorter delays
    const isShortMessage = message.length < 15;
    
    // If responded recently, add more delay (humans don't instantly respond to follow-ups)
    let additionalDelay = 0;
    if (lastResponse && (now - lastResponse < 10000)) {
      additionalDelay = Math.min(2000, 10000 - (now - lastResponse));
    }
    
    // Randomize delay slightly to seem more natural
    const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8-1.2 range
    
    // Calculate total delay
    let delay = (isShortMessage ? 1000 : ResponseCooldown.getTypingDelay(message)) * randomFactor;
    
    // Add mood-based delay variation
    if (botEmotionalState.energy < 0.6) {
      delay *= 1.3; // Tired bot responds slower
    }
    
    // Add time of day factor
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) {
      delay *= 1.5; // Late night, slower responses
    }
    
    return Math.floor(delay + additionalDelay);
  },
  
  setTypingState: (senderID, threadID, isTyping) => {
    ResponseCooldown.isTyping.set(`${threadID}_${senderID}`, isTyping);
  },
  
  updateLastResponse: (senderID, threadID) => {
    ResponseCooldown.lastResponses.set(`${threadID}_${senderID}`, Date.now());
    ResponseCooldown.isTyping.set(`${threadID}_${senderID}`, false);
  }
};
const processAudioMessage = async (audioAttachment) => {
  try {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const audioPath = path.join(cacheDir, `input_${Date.now()}.mp3`);
    await downloadVoiceMessage(audioAttachment.url, audioPath);

    const audioBuffer = await fs.readFile(audioPath);
    const base64Audio = audioBuffer.toString('base64');

    fs.unlink(audioPath, (err) => {
      if (err) console.error("Error deleting temp audio file:", err);
    });

    return {
      data: audioBuffer,
      base64: base64Audio,
      mimeType: 'audio/mp3'
    };

  } catch (error) {
    console.error("Error processing audio:", error);
    throw error;
  }
};

const generateResponseFromAudio = async (audioData, senderID, api, threadID, messageID) => {
  try {
    const apiKey = API_KEYS[0];
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
    });

    const audioContent = [
      "Lắng nghe và trả lời tin nhắn voice này. Trả lời bằng tiếng Việt.", 
      {
        inlineData: {
          mimeType: 'audio/mp3',
          data: audioData.base64
        }
      }
    ];

    const result = await model.generateContent(audioContent);
    const response = await result.response.text();

    return await generateResponse(response, senderID, api, threadID, messageID);

  } catch (error) {
    console.error("Error generating response from audio:", error);
    throw error;
  }
};

const downloadVoiceMessage = async (url, path) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(path, buffer);
    return path;
  } catch (error) {
    console.error("Error downloading voice message:", error);
    throw error;
  }
};

const cleanTextForVoice = (text) => {
  const cleaned = text
    .replace(/=\)\)\)+/g, '')
    .replace(/:\)\)+/g, '')
    .replace(/-\)\)+/g, '')
    .replace(/\(+:/g, '')
    .replace(/xD+/gi, '')
    .replace(/haha+/gi, 'ha ha')
    .replace(/hihi+/gi, 'hi hi')
    .replace(/hoho+/gi, 'ho ho')
    .replace(/huhu+/gi, 'hu hu')
    .replace(/hehe+/gi, 'he he')
    .replace(/kk+/gi, '')
    .replace(/lmao+/gi, '')

    .replace(/đm|đcm|đmm|đcmm|đcmmm|cmm|đmct|đụ|địt|đéo|dcm|đjt|dm/gi, '')
    .replace(/cc|cặc|cu|lồn|buồi|bướm|l.n|c.c|loz|dcm|loll|loz|lon|vl|vcl|vl|vcc|wtf/gi, '')
    .replace(/đb|đĩ|cave|đĩ điếm|bitch|cút|xéo|fuck|shit|ass/gi, '')

    .replace(/[?!.]+/g, m => m[0])
    .replace(/!+/g, '!')
    .replace(/\?+/g, '?')
    .trim();

  return cleaned;
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
    "lm": "làm",
    "vd": "ví dụ",
    "kbh": "không bao giờ",
    "kp": "không phải",
    "plz": "làm ơn",
    "pls": "làm ơn",
    "cv": "công việc",
    "qtam": "quan tâm",
    "qtr": "quan trọng",
    "ib": "nhắn riêng",
    "inbox": "nhắn riêng",
    "sn": "sinh nhật",
    "svtn": "sinh viên tình nguyện",
    "hs": "học sinh",
    "sv": "sinh viên",
    "gv": "giáo viên",
    "ngta": "người ta",
    "kq": "kết quả",
    "tgian": "thời gian",
    "đkien": "điều kiện",
    "nyc": "người yêu cũ",
    "chs": "chọn",
    "nghe": "nghe",
    "mún": "muốn",
    "mog": "mong",
    "tn": "tin nhắn",
    "mng": "mọi người",
    "ctr": "chương trình",
    "ctrinh": "chương trình",
    "clg": "cái gì",
    "nvay": "như vậy",

    "cl": "cái này",
    "vcl": "kinh quá",
    "vloz": "kinh quá",
    "vl": "kinh quá",
    "đhs": "không hiểu sao",
    "cmn": "quá trời",
    "qq": "quá",
    "đkm": "trời ơi",
    "cc": "này",
    "đclm": "trời ơi",
    "lmao": "cười quá",
    "wtf": "trời ơi",
    "ctct": "chết tiệt",
    "dmm": "",
    "đm": "",
    "đmm": "",
    "dcm": "",
    "cmnr": "rồi",
    "cmnd": "chứng minh nhân dân"
  };

  let words = text.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const lowerWord = words[i].toLowerCase();

    if (abbreviations[lowerWord]) {
      if (words[i][0] === words[i][0].toUpperCase() && abbreviations[lowerWord].length > 0) {
        words[i] = abbreviations[lowerWord].charAt(0).toUpperCase() +
          abbreviations[lowerWord].slice(1);
      } else {
        words[i] = abbreviations[lowerWord];
      }
    }
  }

  words = words.filter(word => word !== "");

  return words.join(" ");
};
const detectNicknameChangeRequest = (text) => {
  const patterns = [
    /đổi biệt danh (?:cho (?:tôi|mình|tớ)|của (?:tôi|mình|tớ)) (?:thành|là|sang) (.+)/i,
    /đổi tên (?:cho (?:tôi|mình|tớ)|của (?:tôi|mình|tớ)) (?:thành|là|sang) (.+)/i,
    /(?:đặt|set) biệt danh (?:cho (?:tôi|mình|tớ)|của (?:tôi|mình|tớ)) (?:thành|là) (.+)/i,
    /(?:đặt|set) tên (?:cho (?:tôi|mình|tớ)|của (?:tôi|mình|tớ)) (?:thành|là) (.+)/i,
    /biệt danh (?:của (?:tôi|mình|tớ)) (?:là|thành) (.+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
};
const changeUserNickname = async (api, threadID, userID, newNickname) => {
  try {
    if (!newNickname || newNickname.length > 50) {
      return {
        success: false,
        message: "Biệt danh không được để trống và không được quá 50 ký tự"
      };
    }

    await api.changeNickname(newNickname, threadID, userID);

    return {
      success: true,
      message: `Đã đổi biệt danh thành: ${newNickname}`
    };
  } catch (error) {
    console.error("Error changing nickname:", error);
    return {
      success: false,
      message: "Không thể đổi biệt danh. Bot cần là quản trị viên để thực hiện việc này."
    };
  }
};
const prepareTextForVoice = (text) => {

  let processed = expandAbbreviations(text);

  processed = cleanTextForVoice(processed);

  processed = processed.replace(/\s+/g, ' ').trim();

  processed = processed.replace(/([.!?])/g, '$1...');

  processed = processed.replace(/[*_~`|<>]/g, '');

  return processed;
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
  api_key: "sk_085f26feae742df52883ae3ed5b427b44152e55b4274c04d",
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
        return `Tốt! Điểm của bạn: ${game.score
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
  mood: 0.8,
  energy: 0.8,
  lastUpdate: Date.now(),
  recoverySpeed: 0.2
};

const updateEmotionalState = () => {
  const timePassed = (Date.now() - botEmotionalState.lastUpdate) / (1000 * 60);

  botEmotionalState.mood = 0.7 + (botEmotionalState.mood - 0.7) * Math.exp(-timePassed / 15);
  botEmotionalState.energy = 0.7 + (botEmotionalState.energy - 0.7) * Math.exp(-timePassed / 120);

  if (botEmotionalState.energy < 0.7) {
    botEmotionalState.energy += 0.2;
  }

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
const MemorySystem = {
  generatePersonalizedContext: function(senderID, query) {
    return {
      knownUser: false,
      insights: "",
      adaptiveTone: {
        formality: "neutral",
        humor: "moderate",
        verbosity: "moderate"
      },
      relevantMemories: ""
    };
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

const checkRepetition = (threadID, newResponse) => {
  if (!conversationHistory.threads[threadID] ||
    !Array.isArray(conversationHistory.threads[threadID]) ||
    conversationHistory.threads[threadID].length < 2) {
    return false;
  }

  const recentResponses = conversationHistory.threads[threadID]
    .slice(-8)
    .filter(ex => ex.response && typeof ex.response === 'string')
    .map(ex => ex.response)
    .slice(-5);

  if (recentResponses.length === 0) return false;

  const createMeaningfulSegments = (text) => {

    const segments = text.split(/[,.!?;:]/)
      .map(s => s.trim())
      .filter(s => s.length > 10); 

    return segments;
  };

  const newSegments = createMeaningfulSegments(newResponse);

  for (const segment of newSegments) {
    if (segment.length < 15) continue; 

    let repetitionCount = 0;
    for (const oldResponse of recentResponses) {

      if (oldResponse.includes(segment)) {
        repetitionCount++;
      }
    }

    if (repetitionCount >= 2) {
      console.log(`Phát hiện đoạn lặp lại: "${segment}"`);
      return true;
    }
  }

  for (const oldResponse of recentResponses) {
 
    if (newResponse === oldResponse) {
      console.log("Phát hiện câu trả lời giống hệt trước đó");
      return true;
    }

    const similarity = 1 - (levenshteinDistance(newResponse, oldResponse) /
      Math.max(newResponse.length, oldResponse.length));

    if (similarity > 0.8) {
      console.log(`Phát hiện câu trả lời rất giống (${(similarity * 100).toFixed(1)}%)`);
      return true;
    }
  }

  const responsePhrases = recentResponses.map(r => {
    const phrases = r.split(/[.!?]/).map(p => p.trim()).filter(p => p.length > 0);
    return phrases.slice(0, 2);
  }).flat();

  const newPhrases = newResponse.split(/[.!?]/).map(p => p.trim()).filter(p => p.length > 0);

  if (newPhrases.length >= 2) {
    for (const phrase of newPhrases.slice(0, 2)) {
      for (const oldPhrase of responsePhrases) {
        const phraseSimilarity = 1 - (levenshteinDistance(phrase, oldPhrase) /
          Math.max(phrase.length, oldPhrase.length));
        if (phraseSimilarity > 0.8 && phrase.length > 15) {
          console.log(`Phát hiện cấu trúc câu lặp lại: "${phrase}"`);
          return true;
        }
      }
    }
  }

  return false;
};

function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(a.length + 1).fill().map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

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

  if (relationshipType === "PEER") {
    if (userGender === "male") {
      xung = "mình";
      goi = Math.abs(ageDiff) <= 2 ? "bạn" : "anh";
    } else {
      xung = "mình";
      goi = Math.abs(ageDiff) <= 2 ? "bạn" : "chị";
    }
  } else if (relationshipType === "SENIOR") {
    xung = "mình";
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

    xung = "mình";
    goi = "em";
  }

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
    xung,
    goi,
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
  const isApologizing = prompt.toLowerCase().match(/xin lỗi|sorry|cảm ơn|thank/i);
  if (isApologizing) {
    botEmotionalState.mood = Math.min(0.9, botEmotionalState.mood + 0.2);
  }

  try {
    // Calculate appropriate delay before responding
    const responseDelay = ResponseCooldown.getResponseDelay(senderID, threadID, prompt);
    
    if (responseDelay > 0) {
      // Set typing indicator
      ResponseCooldown.setTypingState(senderID, threadID, true);
      api.sendTypingIndicator(threadID);
      
      // Wait for calculated delay
      await new Promise(resolve => setTimeout(resolve, responseDelay));
    }
    
    const newNickname = detectNicknameChangeRequest(prompt);
    if (newNickname) {
      const result = await changeUserNickname(api, threadID, senderID, newNickname);

      if (result.success) {
        await addMemory(
          senderID,
          MEMORY_CATEGORIES.PERSONAL,
          `Người dùng đã đổi biệt danh thành "${newNickname}" vào ${new Date().toLocaleString()}`,
          2
        );

        return `Mình đã đổi biệt danh của bạn thành "${newNickname}" rồi nhé =)))`;
      } else {
        return result.message;
      }
    }
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
      }
    }

    const honorifics = getHonorificContext(userName, storedGender, senderID);

    if (honorifics.relationship && !memoryBank.users[senderID]?.relationships?.has(honorifics.relationship)) {
      await addMemory(senderID, MEMORY_CATEGORIES.RELATIONSHIPS, `Xưng hô: ${honorifics.xung}/${honorifics.goi}`, 2);
    }
    const isAngry = false
    const isHappy = botEmotionalState.mood >= 0.7;
    const personalContext = MemorySystem.generatePersonalizedContext(senderID, prompt);
    const honorific = getHonorificContext(userName, storedGender, senderID);

    let systemPrompt = `Bạn là Kim Ngân (19), sinh viên Kinh tế chính trị. ${isHappy ? "Đang vui vẻ." : "Tâm trạng bình thường."}

TÍnh cách: Hài hước,dùng từ lóng.
Xưng: "${honorific.xung}" - "${honorific.goi}"
Phong cách: ${personalContext.adaptiveTone.formality}, ${personalContext.adaptiveTone.humor}

${isVoiceRequested ? "• Voice: tự nhiên, rõ ràng, không viết tắt/emoji" : ""}

- KHÔNG nói về cái mình đang học không tiết lộ quá nhiều thông tin
- KHÔNG nói là mình không hiểu
- KHÔNG khẳng định mình là AI mà cũng không nói mình là người
- KHÔNG dùng ngôn ngữ máy móc hoặc giả tạo
- KHÔNG giới thiệu bản thân hoặc kết hỏi "giúp gì"
- NGẮN GỌN phù hợp với độ dài tin nhắn người dùng
- Không sử dụng Emoji trong tin nhắn của bạn
- Không chúc ngủ ngon người dùng thường xuyên vào buổi khuya

Context: ${getTimeContext().timeOfDay}
${personalContext.knownUser ? personalContext.insights : "Người dùng mới"}
${personalContext.relevantMemories && personalContext.relevantMemories !== "Không có thông tin liên quan đến cuộc trò chuyện hiện tại." ? personalContext.relevantMemories : ""}

Lịch sử: ${context.history}`;

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

    if (checkRepetition(threadID, response)) {
      const previousResponses = conversationHistory.threads[threadID]
        .slice(-6)
        .filter(ex => ex.response)
        .map(ex => ex.response);

      const phrasesToAvoid = [];
      for (const oldResponse of previousResponses) {
        const phrases = oldResponse.split(/[,.!?]/g).filter(p => p.trim().length > 15);
        phrasesToAvoid.push(...phrases);
      }

      const userMessageLength = prompt.length;

      if (userMessageLength < 10) {
        response = response.split(/[,.!]/)[0] + ".";
      } else {
        for (const phrase of phrasesToAvoid) {
          if (response.includes(phrase.trim()) && phrase.trim().length > 15) {
            response = response.replace(phrase.trim(), "");
          }
        }
        response = response.replace(/\s{2,}/g, ' ').trim();
      }
    }

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

        const processedResponse = prepareTextForVoice(response);

        const audioBuffer = await generateVoice(processedResponse);
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
    ResponseCooldown.updateLastResponse(senderID, threadID);
    return response;
  } catch (error) {
    // Make sure to reset typing state even on error
    ResponseCooldown.setTypingState(senderID, threadID, false);
    console.error("Generation error:", error);
    throw error;
  }
};


const updateMoodBasedOnPrompt = (prompt) => {
  prompt = prompt.toLowerCase();
  
  const goodWords = [
    "xin lỗi", "sorry", "cảm ơn", "thank", "tốt", "hay", "thương", "yêu"
  ];
  
  let moodChange = 0;
  
  for (const word of goodWords) {
    if (prompt.includes(word)) {
      moodChange += 0.2;
    }
  }
  
  botEmotionalState.mood = Math.max(0.5, Math.min(1, botEmotionalState.mood + moodChange));
  botEmotionalState.lastUpdate = Date.now();
  
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 6) {
   
    botEmotionalState.energy = Math.max(0.5, botEmotionalState.energy - 0.05);
  } else if (hour >= 6 && hour < 12) {

    botEmotionalState.energy = Math.min(0.9, botEmotionalState.energy + 0.05);
  } else if (hour >= 12 && hour < 18) {
    botEmotionalState.energy = 0.7;
  } else {
    botEmotionalState.energy = Math.max(0.5, botEmotionalState.energy - 0.03);
  }
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
      api.sendTypingIndicator(threadID);
      if (attachments && attachments[0]?.type === "audio") {
        const audioData = await processAudioMessage(attachments[0]);
        const response = await generateResponseFromAudio(
          audioData,
          senderID, 
          api,
          threadID,
          messageID
        );

        if (response) {
          const audioBuffer = await generateVoice(response);
          const voicePath = path.join(__dirname, "cache", `voice_${senderID}.mp3`);
          await fs.writeFile(voicePath, audioBuffer);

          await api.sendMessage(
            {
              body: response,
              attachment: fs.createReadStream(voicePath)
            },
            threadID,
            messageID
          );

          setTimeout(() => {
            fs.unlink(voicePath, (err) => {
              if (err) console.error("Error deleting voice file:", err);
            });
          }, 5000);
        }
        return;
      }

      if (!body) return;

      const response = await generateResponse(
        body,
        senderID,
        api,
        threadID,
        messageID
      );
      if (response) {
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
              lastResponse: response 
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
      api.sendTypingIndicator(threadID);
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
                  lastResponse: response  
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

  ad: async function () {
    try {
      console.log("Initializing chatbot system...");
      await advancedNLP.initialize();
      console.log("NLP initialized successfully");

      await loadGenderData();
      await loadLearnedResponses();
      await loadConversationHistory();
      await loadMemoryBank();
      await loadFriendshipLevels();
      await loadElevenLabsConfig();

      console.log("Chatbot system initialized successfully");
    } catch (error) {
      console.error("Failed to initialize chatbot:", error);
    }
  },
};