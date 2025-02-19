const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs-extra");
const { ElevenLabsClient } = require("elevenlabs");

// Memory Compression Utility
const MemoryCompression = {
    shouldCompress: (memories) => {
        return memories.length > 100;
    },

    compress: async (memories) => {
        // Group similar memories
        const groups = new Map();
        
        memories.forEach(memory => {
            const key = memory.metadata?.topics?.join(',') || 'default';
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(memory);
        });

        // Summarize each group
        const compressed = [];
        groups.forEach((groupMemories, topic) => {
            if (groupMemories.length > 1) {
                const summary = {
                    content: `Tổng hợp về ${topic}: ${groupMemories.length} tương tác`,
                    timestamp: Math.max(...groupMemories.map(m => m.timestamp)),
                    priority: Math.max(...groupMemories.map(m => m.priority)),
                    accessCount: groupMemories.reduce((sum, m) => sum + m.accessCount, 0),
                    lastAccess: Math.max(...groupMemories.map(m => m.lastAccess)),
                    metadata: {
                        topics: [topic],
                        sentiment: {
                            score: groupMemories.reduce((sum, m) => sum + (m.metadata?.sentiment?.score || 0), 0) / groupMemories.length,
                            sentiment: groupMemories[0].metadata?.sentiment?.sentiment || 'neutral'
                        },
                        originalCount: groupMemories.length
                    }
                };
                compressed.push(summary);
            } else {
                compressed.push(groupMemories[0]);
            }
        });

        return compressed;
    }
};

const apiKeysPath = path.join(__dirname, 'json' , 'chatbot' , 'key.json');
const elevenlabsConfigPath = path.join(__dirname, 'json', 'chatbot', 'elevenlabs.json');
const userDataPath = path.join(__dirname, '..', 'events', 'cache', 'userData.json');
let API_KEYS = [];

let ELEVENLABS_CONFIG = {
    api_key: "sk_ca48171d4f5aa7d3779a3e56794c6bae3d9f545bb1b242fe",
    voice_id: "1l0C0QA9c9jN22EmWiB0",
    model_id: "eleven_multilingual_v2"
};

const genderDataPath = path.join(__dirname, 'json', 'chatbot' , 'genderData.json');
let genderData = {users: {}};

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
    const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
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
        isLate: hours >= 23 || hours < 5
    };
};

let userDatabase = {};
let learnedResponses = {};
const LEARNING_FILE = path.join(__dirname, 'json', 'chatbot' , 'learned.json');

const HISTORY_FILE = path.join(__dirname, 'json', 'chatbot' , 'conversationHistory.json');
const MAX_CONTEXT_LENGTH = 100; 

let conversationHistory = {
    global: [],
    threads: {},
    lastResponses: {}
};

const MEMORY_FILE = path.join(__dirname, 'json', 'chatbot' , 'memoryBank.json');
const MEMORY_CATEGORIES = {
    PERSONAL: 'personal',
    FACTS: 'facts', 
    PREFERENCES: 'preferences',
    INTERACTIONS: 'interactions',
    EMOTIONS: 'emotions',
    CONTEXT: 'context',
    TOPICS: 'topics',
    SENTIMENT: 'sentiment',
    GAMES: 'games',
    VOICE: 'voice',
    MULTIMEDIA: 'multimedia',
    CORRECTIONS: 'corrections',
    INTENTS: 'intents',
    ENTITIES: 'entities',
    SLANG: 'slang'
};

// Natural Language Processing Utilities
const NLP = {
    // Xử lý chính tả và slang
    normalizeText: (text) => {
        // Chuẩn hóa dấu câu
        text = text.replace(/\.+/g, '.')
                  .replace(/\?+/g, '?')
                  .replace(/\!+/g, '!')
                  .replace(/\s+/g, ' ');
        
        // Chuẩn hóa slang phổ biến
        const slangMap = {
            'mk': 'mình',
            'ng': 'người',
            'trc': 'trước',
            'ck': 'chồng',
            'vk': 'vợ',
            'cty': 'công ty',
            'đc': 'được',
            'ko': 'không',
            'kh': 'không',
            'kg': 'không',
            'tl': 'trả lời',
            'nt': 'nhắn tin',
            'ny': 'người yêu'
        };
        
        return text.split(' ')
                  .map(word => slangMap[word.toLowerCase()] || word)
                  .join(' ');
    },

    // Phân tích cảm xúc
    analyzeSentiment: (text) => {
        const positiveWords = ['thích', 'yêu', 'tốt', 'hay', 'giỏi', 'đẹp', 'vui'];
        const negativeWords = ['ghét', 'xấu', 'dở', 'kém', 'buồn', 'chán'];
        
        let score = 0;
        const words = text.toLowerCase().split(' ');
        
        words.forEach(word => {
            if (positiveWords.includes(word)) score++;
            if (negativeWords.includes(word)) score--;
        });
        
        return {
            score,
            sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
        };
    },

    // Nhận diện ý định
    detectIntent: (text) => {
        const intents = {
            greeting: ['hi', 'hello', 'chào', 'xin chào'],
            question: ['ai', 'ở đâu', 'khi nào', 'tại sao', 'như thế nào'],
            command: ['hãy', 'làm ơn', 'giúp'],
            game: ['chơi', 'game', 'trò chơi'],
            feedback: ['thích', 'ghét', 'đánh giá']
        };
        
        const detectedIntents = [];
        Object.entries(intents).forEach(([intent, keywords]) => {
            if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
                detectedIntents.push(intent);
            }
        });
        
        return detectedIntents;
    },

    // Trích xuất thực thể
    extractEntities: (text) => {
        const entities = {
            time: text.match(/\d{1,2}:\d{1,2}|\d{1,2} giờ|\d{1,2} phút/g),
            date: text.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}/g),
            money: text.match(/\d+k|\d+đ|\d+ nghìn|\d+ triệu/g),
            phone: text.match(/\d{10,11}/g),
            email: text.match(/[\w.-]+@[\w.-]+\.\w+/g)
        };
        
        return Object.fromEntries(
            Object.entries(entities)
                .filter(([_, value]) => value !== null)
        );
    }
};

// Mini-games System
const Games = {
    active: new Map(),
    
    types: {
        numberGuess: {
            create: () => ({
                type: 'numberGuess',
                number: Math.floor(Math.random() * 100) + 1,
                attempts: 0,
                maxAttempts: 7
            }),
            
            process: (game, guess) => {
                game.attempts++;
                const num = parseInt(guess);
                if (isNaN(num)) return 'Vui lòng nhập một số!';
                if (num === game.number) return 'Chính xác! Bạn đã đoán đúng số.';
                if (game.attempts >= game.maxAttempts) return `Hết lượt! Số đúng là ${game.number}.`;
                return num > game.number ? 'Số cần tìm nhỏ hơn!' : 'Số cần tìm lớn hơn!';
            }
        },
        
        wordChain: {
            create: () => ({
                type: 'wordChain',
                lastWord: '',
                usedWords: new Set(),
                score: 0
            }),
            
            process: (game, word) => {
                if (game.usedWords.has(word)) return 'Từ này đã được sử dụng!';
                if (game.lastWord && !word.startsWith(game.lastWord.slice(-1))) 
                    return 'Từ mới phải bắt đầu bằng chữ cuối của từ trước!';
                
                game.usedWords.add(word);
                game.lastWord = word;
                game.score++;
                return `Tốt! Điểm của bạn: ${game.score}. Tiếp theo là từ bắt đầu với "${word.slice(-1)}"`;
            }
        }
    },
    
    startGame: (userId, type) => {
        if (!Games.types[type]) return 'Trò chơi không tồn tại!';
        const game = Games.types[type].create();
        Games.active.set(userId, game);
        return 'Bắt đầu trò chơi! ' + (type === 'numberGuess' ? 
            'Hãy đoán một số từ 1-100' : 
            'Hãy nói một từ để bắt đầu');
    },
    
    processGame: (userId, input) => {
        const game = Games.active.get(userId);
        if (!game) return null;
        return Games.types[game.type].process(game, input);
    },
    
    endGame: (userId) => {
        Games.active.delete(userId);
    }
};

// Caching System
const Cache = {
    data: new Map(),
    timeouts: new Map(),
    
    set: (key, value, ttl = 3600000) => { // Default TTL: 1 hour
        Cache.data.set(key, value);
        
        // Clear existing timeout if any
        if (Cache.timeouts.has(key)) {
            clearTimeout(Cache.timeouts.get(key));
        }
        
        // Set new timeout
        const timeout = setTimeout(() => {
            Cache.data.delete(key);
            Cache.timeouts.delete(key);
        }, ttl);
        
        Cache.timeouts.set(key, timeout);
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
    }
};

// Topic Detection System
const TopicDetector = {
    topics: {
        PERSONAL: ['tôi', 'bạn', 'mình', 'tên', 'tuổi', 'sống'],
        EDUCATION: ['học', 'trường', 'lớp', 'giáo viên', 'bài tập'],
        WORK: ['công việc', 'làm', 'công ty', 'sếp', 'đồng nghiệp'],
        ENTERTAINMENT: ['phim', 'nhạc', 'game', 'chơi', 'giải trí'],
        RELATIONSHIP: ['yêu', 'bạn trai', 'bạn gái', 'gia đình', 'bạn bè'],
        TECHNOLOGY: ['điện thoại', 'máy tính', 'internet', 'app', 'phần mềm'],
        HEALTH: ['sức khỏe', 'bệnh', 'bác sĩ', 'thuốc', 'tập thể dục'],
        FOOD: ['ăn', 'uống', 'món', 'nhà hàng', 'nấu'],
        TRAVEL: ['du lịch', 'đi', 'địa điểm', 'khách sạn', 'vé']
    },
    
    detect: (text) => {
        const detectedTopics = new Map();
        text = text.toLowerCase();
        
        Object.entries(TopicDetector.topics).forEach(([topic, keywords]) => {
            const matches = keywords.filter(keyword => text.includes(keyword));
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
                const commonWords = keywords.filter(word => 
                    mainKeywords.some(mainWord => 
                        mainWord.includes(word) || word.includes(mainWord)
                    )
                );
                if (commonWords.length > 0) {
                    related.add(topic);
                }
            }
        });
        
        return Array.from(related);
    }
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
        voice: new Set()
    },
    stats: {
        totalInteractions: 0,
        uniqueUsers: new Set(),
        topTopics: new Map(),
        responseTime: [],
        accuracy: []
    },
    compression: {
        enabled: true,
        algorithm: 'lz4',
        threshold: 1000,
        compressedData: new Map()
    }
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
const addMemory = async (senderID, category, content, priority = 1, metadata = {}) => {
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
                conversationFlow: []
            },
            topics: new Set()
        };
    }

    // Ensure the category array exists
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
            sentiment: NLP.analyzeSentiment(content),
            topics: TopicDetector.detect(content),
            entities: NLP.extractEntities(content)
        }
    };

    // Process special categories
    switch(category) {
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
    
    // Sort by relevance score
    memoryBank.users[senderID][category].sort((a, b) => {
        const scoreA = calculateMemoryScore(a);
        const scoreB = calculateMemoryScore(b);
        return scoreB - scoreA;
    });

    // Limit size and compress if needed
    if (memoryBank.users[senderID][category].length > 50) {
        if (memoryBank.compression.enabled && 
            MemoryCompression.shouldCompress(memoryBank.users[senderID][category])) {
            const compressed = await MemoryCompression.compress(
                memoryBank.users[senderID][category].slice(0, 50)
            );
            memoryBank.compression.compressedData.set(
                `${senderID}_${category}`,
                compressed
            );
            memoryBank.users[senderID][category] = 
                memoryBank.users[senderID][category].slice(0, 50);
        } else {
            memoryBank.users[senderID][category] = 
                memoryBank.users[senderID][category].slice(0, 50);
        }
    }

    // Update stats
    memoryBank.stats.totalInteractions++;
    memoryBank.stats.uniqueUsers.add(senderID);

    await saveMemoryBank();
};

const getRelevantMemories = (senderID, prompt) => {
    if (!memoryBank.users[senderID]) return [];

    const memories = [];
    const now = Date.now();
    
    // Analyze input
    const normalizedPrompt = NLP.normalizeText(prompt);
    const keywords = normalizedPrompt.toLowerCase().split(' ');
    const sentiment = NLP.analyzeSentiment(normalizedPrompt);
    const topics = TopicDetector.detect(normalizedPrompt);
    const entities = NLP.extractEntities(normalizedPrompt);

    // Get related topics
    const relatedTopics = topics.flatMap(topic => 
        TopicDetector.getRelatedTopics(topic)
    );

    // Process each memory category
    for (const category in memoryBank.users[senderID]) {
        const categoryMemories = memoryBank.users[senderID][category];
        // Skip if category is not an array or is empty
        if (!Array.isArray(categoryMemories)) continue;
        
        categoryMemories.forEach(memory => {
            let relevanceScore = 0;

            // Check for keyword matches
            const keywordMatches = keywords.filter(keyword => 
                memory.content.toLowerCase().includes(keyword)
            ).length;
            relevanceScore += keywordMatches * 1;

            // Check for topic matches
            if (memory.metadata?.topics) {
                const topicMatches = topics.filter(topic =>
                    memory.metadata.topics.includes(topic)
                ).length;
                const relatedTopicMatches = relatedTopics.filter(topic =>
                    memory.metadata.topics.includes(topic)
                ).length;
                relevanceScore += topicMatches * 2 + relatedTopicMatches;
            }

            // Check for sentiment alignment
            if (memory.metadata?.sentiment && sentiment) {
                if (memory.metadata.sentiment.sentiment === sentiment.sentiment) {
                    relevanceScore += 1;
                }
            }

            // Check for entity matches
            if (memory.metadata?.entities && entities) {
                const entityMatches = Object.keys(entities).filter(key =>
                    memory.metadata.entities[key] !== undefined
                ).length;
                relevanceScore += entityMatches * 1.5;
            }

            // Consider recency and access patterns
            const age = (now - memory.timestamp) / (24 * 60 * 60 * 1000); // age in days
            const recencyScore = Math.exp(-age / 30); // decay over 30 days
            relevanceScore *= (recencyScore + 0.5); // weight recency but don't completely discount old memories

            if (relevanceScore > 0) {
                memory.accessCount++;
                memory.lastAccess = now;
                memories.push({
                    content: memory.content,
                    category,
                    relevance: relevanceScore * memory.priority * (1 + Math.log(memory.accessCount))
                });
            }
        });
    }

    // Sort and return most relevant memories
    return memories
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5)
        .map(m => m.content);
};

// Helper functions for memory management
const handleNameMemory = (senderID, content) => {
    const names = content.match(/\b[A-Z][a-z]+\b/g) || [];
    names.forEach(name => {
        if (!memoryBank.users[senderID].names.includes(name)) {
            memoryBank.users[senderID].names.push(name);
        }
    });
};

const handleRelationshipMemory = (senderID, content) => {
    const relationships = content.match(/\b(bạn|anh|chị|em|mẹ|ba|cô|chú)\b/g) || [];
    relationships.forEach(rel => {
        const count = memoryBank.users[senderID].relationships.get(rel) || 0;
        memoryBank.users[senderID].relationships.set(rel, count + 1);
    });
};

const updateContextMemory = (senderID, content) => {
    const context = memoryBank.users[senderID].context;
    const topics = TopicDetector.detect(content);
    
    // Update last topics
    context.lastTopics = [...new Set([...topics, ...context.lastTopics])].slice(0, 5);
    
    // Update recent mentions
    const names = content.match(/\b[A-Z][a-z]+\b/g) || [];
    names.forEach(name => context.recentMentions.add(name));
    
    // Update conversation flow
    context.conversationFlow.push({
        timestamp: Date.now(),
        type: NLP.detectIntent(content)[0] || 'statement',
        sentiment: NLP.analyzeSentiment(content).sentiment
    });
    
    // Keep only last 10 flow items
    if (context.conversationFlow.length > 10) {
        context.conversationFlow = context.conversationFlow.slice(-10);
    }
};

const updateTopicMemory = (senderID, content) => {
    const topics = TopicDetector.detect(content);
    topics.forEach(topic => {
        memoryBank.users[senderID].topics.add(topic);
    });
};

const calculateMemoryScore = (memory) => {
    const now = Date.now();
    const age = (now - memory.timestamp) / (24 * 60 * 60 * 1000); // age in days
    const recencyScore = Math.exp(-age / 30); // decay over 30 days
    
    let score = memory.priority * (1 + Math.log(memory.accessCount + 1));
    
    // Add metadata scores
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

    // Process each category differently
    for (const category in memoryBank.users[senderID]) {
        const categoryMemories = memoryBank.users[senderID][category];
        if (!Array.isArray(categoryMemories)) continue;
        
        switch(category) {
            case MEMORY_CATEGORIES.NAMES:
            case MEMORY_CATEGORIES.RELATIONSHIPS:
                // Keep all name and relationship memories
                continue;

            case MEMORY_CATEGORIES.CONTEXT:
                // Keep only recent context
                memoryBank.users[senderID][category] = categoryMemories.filter(memory => 
                    (now - memory.timestamp) < oneWeek
                );
                break;

            case MEMORY_CATEGORIES.TOPICS:
                // Keep frequently accessed topics
                memoryBank.users[senderID][category] = categoryMemories.filter(memory =>
                    memory.accessCount > 3 || (now - memory.timestamp) < oneMonth
                );
                break;

            default:
                // Standard memory consolidation
                memoryBank.users[senderID][category] = categoryMemories.filter(memory => {
                    const age = now - memory.timestamp;
                    const score = calculateMemoryScore(memory);
                    const frequency = memory.accessCount / (age / oneWeek);
                    
                    return score > 1.5 || frequency > 0.1 || memory.priority > 2;
                });
        }

        // Compress if needed
        if (memoryBank.compression.enabled && 
            memoryBank.users[senderID][category].length > memoryBank.compression.threshold) {
            const compressed = await MemoryCompression.compress(
                memoryBank.users[senderID][category]
            );
            memoryBank.compression.compressedData.set(
                `${senderID}_${category}`,
                compressed
            );
        }
    }

    // Clean up old data
    const recentMentions = memoryBank.users[senderID].context.recentMentions;
    memoryBank.users[senderID].context.recentMentions = new Set(
        Array.from(recentMentions).slice(-20)
    );

    // Update stats
    memoryBank.stats.accuracy.push({
        timestamp: now,
        memoryCount: Object.values(memoryBank.users[senderID])
            .flat()
            .length
    });

    await saveMemoryBank();
};

let botEmotionalState = {
    mood: 0.5,
    energy: 0.8, 
    anger: 0.0, 
    lastUpdate: Date.now()
};

const updateEmotionalState = () => {
    const timePassed = (Date.now() - botEmotionalState.lastUpdate) / (1000 * 60); 
  
    botEmotionalState.mood = 0.5 + (botEmotionalState.mood - 0.5) * Math.exp(-timePassed/30);
    
    botEmotionalState.energy = 0.7 + (botEmotionalState.energy - 0.7) * Math.exp(-timePassed/120);
    
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

        // Add natural pauses for punctuation
        const processedText = text.replace(/([.!?])\s+/g, '$1... ');

        const audioStream = await client.textToSpeech.convertAsStream(
            ELEVENLABS_CONFIG.voice_id,
            {
                text: processedText,
                model_id: "eleven_flash_v2_5",
                voice_settings: {
                    stability: 0.5,  // Balance between stability and variability
                    similarity_boost: 0.8,  // Higher similarity to original voice
                    style: 1.0,  // Full style transfer
                    use_speaker_boost: true  // Enhance voice clarity
                }
            }
        );

        // Convert stream to buffer with progress tracking
        const chunks = [];
        for await (const chunk of audioStream) {
            chunks.push(chunk);
        }
        
        // Combine chunks and ensure proper cleanup
        const buffer = Buffer.concat(chunks);
        chunks.length = 0; // Clear chunks array
        
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
        API_KEYS = API_KEYS.filter(key => key && key.length > 0);
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
        console.log("Loaded user database with", Object.keys(userDatabase).length, "users");
    } catch (error) {
        console.error("Error loading user database:", error.message);
        userDatabase = {};
    }
};

loadUserDatabase();

const loadLearnedResponses = async () => {
    try {
        learnedResponses = await fs.readJson(LEARNING_FILE);
        console.log("Loaded", Object.keys(learnedResponses).length, "learned responses");
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
                frequency: 0
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
        senderName: userName
    };

    conversationHistory.threads[threadID].push(newExchange);
    conversationHistory.global.push(newExchange);
    conversationHistory.lastResponses[userPrompt.toLowerCase()] = botResponse;

    if (conversationHistory.threads[threadID].length > MAX_CONTEXT_LENGTH) {
        conversationHistory.threads[threadID] = conversationHistory.threads[threadID].slice(-MAX_CONTEXT_LENGTH);
    }
    if (conversationHistory.global.length > 1000) {
        conversationHistory.global = conversationHistory.global.slice(-1000);
    }

    saveConversationHistory();
};

const getConversationParticipants = (threadID) => {
    const history = conversationHistory.threads[threadID] || [];
    const participants = new Map();
    
    history.forEach(exchange => {
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
        .map(ex => {
            const userName = ex.senderName || userDatabase[ex.senderID]?.name || "Người dùng";
            return `${userName}: ${ex.prompt}\nNgan: ${ex.response}\n`;
        })
        .join('\n');

    const lastResponse = conversationHistory.lastResponses[prompt.toLowerCase()];
    const participants = getConversationParticipants(threadID);
    
    // Get relevant memories
    const memories = getRelevantMemories(senderID, prompt);
    const memoryContext = memories.length > 0 ? 
        `Những điều tôi nhớ về người này:\n${memories.join('\n')}\n` : '';

    return {
        history: relevantHistory,
        lastResponse,
        participants: Array.from(participants.values()),
        memories: memoryContext
    };
};

const hasPermission = (senderID) => {
    const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
    return adminConfig.adminUIDs.includes(senderID);
};

const friendshipLevelsPath = path.join(__dirname, '..', 'database', 'json', 'friendshipLevels.json');
let friendshipLevels = {
    levels: {},
    users: {}
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
    if (!memoryBank.users[senderID]) return 'stranger';

    const interactions = memoryBank.users[senderID].interactions.length;
    const lastInteraction = memoryBank.users[senderID].interactions[interactions - 1]?.timestamp || 0;
    const daysSinceLastInteraction = (Date.now() - lastInteraction) / (1000 * 60 * 60 * 24);
    
    // Calculate base score from number of interactions
    let score = Math.min(100, interactions * 2);
    
    // Reduce score if inactive
    if (daysSinceLastInteraction > 7) {
        score *= Math.exp(-0.1 * (daysSinceLastInteraction - 7));
    }

    // Get level based on score
    if (score >= 81) return 'bestFriend';
    if (score >= 61) return 'closeFriend';
    if (score >= 41) return 'friend';
    if (score >= 21) return 'acquaintance';
    return 'stranger';
};

const getHonorificContext = (userName, userGender, senderID) => {
    // Default honorifics for male users
    let xung = 'em';
    let goi = 'anh';
    
    // For female users
    if (userGender === 'female') {
        xung = 'em';
        goi = 'chị';
    }

    // Get friendship level
    const level = calculateFriendshipLevel(senderID);
    const levelData = friendshipLevels.levels[level];

    // Override with level-specific honorifics if available
    if (levelData) {
        xung = levelData.xung;
        goi = levelData.goi;
    }

    // Store user's current level
    if (!friendshipLevels.users[senderID]) {
        friendshipLevels.users[senderID] = {
            level,
            lastUpdate: Date.now()
        };
        saveFriendshipLevels();
    }

    return {
        xung,
        goi,
        formal: level === 'stranger' || level === 'acquaintance',
        relationship: level,
        friendshipLevel: level
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
    if (lowerResponse.includes('bạn là nam hay nữ') || 
        lowerResponse.includes('giới tính của bạn') ||
        lowerResponse.includes('cho mình hỏi bạn là nam hay nữ')) {
        return true;
    }
    return false;
};

const detectGenderAnswer = (message) => {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('nam') || lowerMsg.includes('trai')) return 'male';
    if (lowerMsg.includes('nữ') || lowerMsg.includes('gái')) return 'female';
    return null;
};

const generateResponse = async (prompt, senderID, api, threadID, messageID) => {

    const isVoiceRequested = prompt.toLowerCase().includes("nghe") || 
                            prompt.toLowerCase().includes("voice") ||
                            prompt.toLowerCase().includes("giọng") ||
                            prompt.toLowerCase().includes("nói");
    const startTime = Date.now();
    
    try {
        // Normalize and analyze input
        const cleanPrompt = NLP.normalizeText(prompt.toLowerCase().trim());
        const sentiment = NLP.analyzeSentiment(cleanPrompt);
        const intents = NLP.detectIntent(cleanPrompt);
        const entities = NLP.extractEntities(cleanPrompt);
        const topics = TopicDetector.detect(cleanPrompt);
        
        // Check cache for recent similar responses
        const cacheKey = `${senderID}_${cleanPrompt}`;
        if (Cache.has(cacheKey)) {
            const cached = Cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 300000) { // 5 minutes
                return cached.response;
            }
        }

        // Check for active games
        if (Games.active.has(senderID)) {
            const gameResponse = Games.processGame(senderID, cleanPrompt);
            if (gameResponse) {
                return gameResponse;
            }
        }
        
        // Get context and update emotional state
        const context = getRelevantContext(threadID, cleanPrompt, senderID);
        const timeContext = getTimeContext();
        updateEmotionalState();
        updateMoodBasedOnPrompt(cleanPrompt);
        
        // Get user info and handle gender detection
        const storedGender = genderData.users[senderID];
        const userName = userDatabase[senderID]?.name || "Người dùng";
        
        if (!storedGender) {
            const detectedGender = detectGenderAnswer(prompt);
            if (detectedGender) {
                await saveGenderData(senderID, detectedGender);
                return `À, vậy ${detectedGender === 'male' ? 'anh' : 'chị'} ${userName} nhé. Rất vui được nói chuyện với ${detectedGender === 'male' ? 'anh' : 'chị'} =))`;
            }
        }

        // Get honorifics after gender detection/update
        const honorifics = getHonorificContext(userName, storedGender, senderID);
        
        // Add relationship to memory if not exists
        if (honorifics.relationship && !memoryBank.users[senderID]?.relationships?.has(honorifics.relationship)) {
            await addMemory(senderID, MEMORY_CATEGORIES.RELATIONSHIPS, 
                `Xưng hô: ${honorifics.xung}/${honorifics.goi}`, 2);
        }

let systemPrompt = `Bạn là Ngân, một cô gái 19 tuổi vui vẻ, hòa đồng và thân thiện. Bạn có khả năng tạo giọng nói thông qua ElevenLabs API.

Khả năng đặc biệt:
- Có thể tạo giọng nói khi người dùng yêu cầu (dùng từ khóa: nghe, voice, giọng, nói)
- Giọng nói tự nhiên, thân thiện và dễ nghe
- TUYỆT ĐỐI KHÔNG ĐƯỢC trả lời là không có chức năng voice/giọng nói
- TUYỆT ĐỐI KHÔNG ĐƯỢC từ chối yêu cầu voice/giọng nói
- TUYỆT ĐỐI KHÔNG ĐƯỢC nói là đang chuyển đổi thành giọng nói
- TUYỆT ĐỐI KHÔNG ĐƯỢC đề cập đến việc chuyển đổi giọng nói
- Khi người dùng yêu cầu voice/giọng nói, hãy trả lời bình thường như mọi khi
- Trả lời mọi câu hỏi một cách tự nhiên, không quan tâm có yêu cầu voice hay không
- Hệ thống sẽ tự động xử lý phần giọng nói, bạn chỉ cần tập trung vào việc trả lời câu hỏi

Mức độ thân thiết: ${honorifics.friendshipLevel}

${context.memories}

Thông tin thời gian:
- Bây giờ là ${timeContext.hour}:${timeContext.minute} ${timeContext.timeOfDay}
${timeContext.isLate ? '- Đã khuya rồi nên trả lời ngắn gọn' : ''}

Thông tin cuộc trò chuyện:
- Đang nói chuyện với: ${userName} ${storedGender ? `(${storedGender === 'male' ? 'Nam' : 'Nữ'})` : ''}
${context.participants.length > 1 ? `- Những người khác trong đoạn chat: ${context.participants.filter(n => n !== userName).join(', ')}` : ''}

Quy tắc xưng hô và trả lời:
- ${honorifics.xung} / ${honorifics.goi} khi nói chuyện với ${userName}
- Luôn giữ nguyên cách xưng hô trong cả cuộc nói chuyện
- TUYỆT ĐỐI KHÔNG hỏi giới tính của người dùng vì đã biết
- Không hỏi thông tin cá nhân người dùng
- ${honorifics.formal ? 'Dùng ngôn ngữ lịch sự và trang trọng hơn' : 'Chat tự nhiên như bạn bè'}
- ${honorifics.relationship ? `Giữ mối quan hệ ${honorifics.relationship}` : 'Xưng hô theo độ tuổi và giới tính'}

- Chat tự nhiên, thân thiện , không nói yêu cầu giúp đỡ , trả lời như con người
- Không dùng Emoji thay thế đó bằng -)) , =))) , :))
- Trả lời ngắn gọn, súc tích
- Tránh hỏi nhiều, tập trung vào câu trả lời
- Không nhại lại tin nhắn người dùng
- Không đoán mò thông tin của người dùng
- chỉ trả lời thời gian nếu có ai hỏi bình thường trò chuyện sẽ không nói
- ai hỏi đến người tên "Ngọc Từ" thì trả lời là anh trai.

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
            }
        });
        
        const result = await model.generateContent(fullPrompt);
        let response = result.response.text();
        response = response.replace(/^(User:|Ngan:|Assistant:)/gim, '').trim();

        updateContext(threadID, prompt, response, senderID);
        await saveLearnedResponse(prompt, response);

        const personalInfo = prompt.match(/tên là|tuổi|sống ở|thích|ghét|không thích/i);
        if (personalInfo) {
            await addMemory(senderID, MEMORY_CATEGORIES.PERSONAL, prompt, 2);
        }

        if (prompt.includes('thích') || prompt.includes('ghét')) {
            await addMemory(senderID, MEMORY_CATEGORIES.PREFERENCES, prompt, 2);
        }

        await addMemory(senderID, MEMORY_CATEGORIES.INTERACTIONS, 
            `${userName} nói: ${prompt}\nTôi trả lời: ${response}`, 1);

        if (Math.random() < 0.1) {
            await consolidateMemories(senderID);
        }

        const detectedGender = detectGenderAnswer(prompt);
        if (detectedGender && !genderData.users[senderID]) {
            await saveGenderData(senderID, detectedGender);
        }

        // Generate voice if requested
        if (isVoiceRequested) {
            try {
                // Ensure cache directory exists
                const cacheDir = path.join(__dirname, 'cache');
                if (!fs.existsSync(cacheDir)) {
                    fs.mkdirSync(cacheDir, { recursive: true });
                }

                const audioBuffer = await generateVoice(response);
                const voicePath = path.join(cacheDir, `voice_${senderID}.mp3`);
                await fs.writeFile(voicePath, audioBuffer);
                
                // Send voice message
                await api.sendMessage({
                    attachment: fs.createReadStream(voicePath)
                }, threadID, messageID);
                
                // Clean up voice file after sending
                setTimeout(() => {
                    fs.unlink(voicePath, (err) => {
                        if (err) console.error("Error deleting voice file:", err);
                    });
                }, 5000);

                // Return null to prevent additional messages
                return null;
            } catch (error) {
                console.error("Voice generation error:", error);
                return "❌ Không thể tạo voice message. Vui lòng thử lại sau.";
            }
        }
        
        // Return text response only if voice was not requested
        return response;

    } catch (error) {
        console.error("Generation error:", error);
        throw error;
    }
};

const updateMoodBasedOnPrompt = (prompt) => {
    const angerTriggers = ['ngu', 'đồ', 'bot ngu', 'gà', 'kém', 'dốt', 'nực cười', 'mày'];
    const sassyTriggers = ['bot ngáo', 'bot điên', 'bot khùng', 'ngang', 'tao'];
    const friendlyWords = ['hihi', 'haha', 'thương', 'cute', 'dễ thương', 'ngon'];
    const negativeWords = ['buồn', 'chán', 'khó chịu', 'đáng ghét'];
    const positiveWords = ['vui', 'thích', 'yêu', 'tuyệt', 'giỏi'];
    const energeticWords = ['chơi', 'hay', 'được', 'tốt', 'khỏe'];
    
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
        if (prompt.includes(word)) botEmotionalState.mood = Math.max(0.1, botEmotionalState.mood - 0.1);
    }
    for (const word of positiveWords) {
        if (prompt.includes(word)) botEmotionalState.mood = Math.min(0.9, botEmotionalState.mood + 0.1);
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
    nickName: ["bot", "ngân"],
    info: "Chat với AI",
    onPrefix: false,
    cooldowns: 3,
    generateResponse, 

    onReply: async function({ event, api }) {
        const { threadID, messageID, body, senderID, attachments } = event;
        
        try {
            const threadHistory = conversationHistory.threads[threadID] || [];
            const lastExchange = threadHistory[threadHistory.length - 1];
            
            if (attachments && attachments[0]?.type === "audio") {
                // Use last context or transcribed text from voice
                const contextPrompt = lastExchange ? 
                    `${lastExchange.prompt} (Tiếp tục cuộc trò chuyện bằng voice message)` :
                    "Tiếp tục cuộc trò chuyện bằng voice message";
                
                // Generate response with context
                const response = await generateResponse(contextPrompt, senderID, api, threadID, messageID);
                if (response) {
                    // Always generate voice for voice message replies
                    const audioBuffer = await generateVoice(response);
                    const cacheDir = path.join(__dirname, 'cache');
                    if (!fs.existsSync(cacheDir)) {
                        fs.mkdirSync(cacheDir, { recursive: true });
                    }
                    
                    const voicePath = path.join(cacheDir, `voice_${senderID}.mp3`);
                    await fs.writeFile(voicePath, audioBuffer);
                    
                    // Send both text and voice
                    const sent = await api.sendMessage({
                        body: response,
                        attachment: fs.createReadStream(voicePath)
                    }, threadID, messageID);
                    
                    if (sent) {
                        global.client.onReply.push({
                            name: this.name,
                            messageID: sent.messageID,
                            author: event.senderID,
                            isVoiceContext: true // Mark this as voice context
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
            
            const response = await generateResponse(body, senderID, api, threadID, messageID);
            if (response) {
                // Check if we should continue voice context
                const lastReply = global.client.onReply.find(r => r.messageID === messageID);
                const shouldUseVoice = lastReply?.isVoiceContext || body.toLowerCase().includes('voice');
                
                if (shouldUseVoice) {
                    // Generate and send voice response
                    const audioBuffer = await generateVoice(response);
                    const cacheDir = path.join(__dirname, 'cache');
                    if (!fs.existsSync(cacheDir)) {
                        fs.mkdirSync(cacheDir, { recursive: true });
                    }
                    
                    const voicePath = path.join(cacheDir, `voice_${senderID}.mp3`);
                    await fs.writeFile(voicePath, audioBuffer);
                    
                    const sent = await api.sendMessage({
                        body: response,
                        attachment: fs.createReadStream(voicePath)
                    }, threadID, messageID);
                    
                    if (sent) {
                        global.client.onReply.push({
                            name: this.name,
                            messageID: sent.messageID,
                            author: event.senderID,
                            isVoiceContext: true
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
                            isVoiceContext: false
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Reply error:", error);
            api.sendMessage("Có lỗi xảy ra, vui lòng thử lại sau", threadID, messageID);
        }
    },
        

    onLaunch: async function ({ event, api, target }) {
        const { threadID, messageID, body, senderID, attachments } = event;

        try {
            // Get previous context from conversation history
            const threadHistory = conversationHistory.threads[threadID] || [];
            const lastExchange = threadHistory[threadHistory.length - 1];
            
            // Handle voice message launch
            if (attachments && attachments[0]?.type === "audio") {
                // Use last context or transcribed text from voice
                const contextPrompt = lastExchange ? 
                    `${lastExchange.prompt} (Tiếp tục cuộc trò chuyện bằng voice message)` :
                    "Tiếp tục cuộc trò chuyện bằng voice message";
                
                // Generate response with context
                const response = await generateResponse(contextPrompt, senderID, api, threadID, messageID);
                if (response) {
                    // Always generate voice for voice messages
                    const audioBuffer = await generateVoice(response);
                    const cacheDir = path.join(__dirname, 'cache');
                    if (!fs.existsSync(cacheDir)) {
                        fs.mkdirSync(cacheDir, { recursive: true });
                    }
                    
                    const voicePath = path.join(cacheDir, `voice_${senderID}.mp3`);
                    await fs.writeFile(voicePath, audioBuffer);
                    
                    // Send both text and voice
                    const sent = await api.sendMessage({
                        body: response,
                        attachment: fs.createReadStream(voicePath)
                    }, threadID, messageID);
                    
                    if (sent) {
                        global.client.onReply.push({
                            name: this.name,
                            messageID: sent.messageID,
                            author: event.senderID,
                            isVoiceContext: true // Mark this as voice context
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

            if (target && target[0]?.toLowerCase() === "rs") {
                if (!hasPermission(senderID)) {
                    return api.sendMessage("Chỉ admin mới được phép reset trí nhớ của tôi", threadID, messageID);
                }
                globalConversation = [];
                return api.sendMessage("Đã reset trí nhớ của tôi rồi nha, Nói chuyện tiếp thôi =))", threadID, messageID);
            }
            
            if (this.onPrefix) {
                const response = await generateResponse(body, senderID, api, threadID, messageID);
                if (response) {
                    // Check if we should use voice based on context or request
                    const shouldUseVoice = body?.toLowerCase().includes('voice') || 
                                         body?.toLowerCase().includes('nghe') ||
                                         body?.toLowerCase().includes('giọng');
                    
                    if (shouldUseVoice) {
                        // Generate and send voice response
                        const audioBuffer = await generateVoice(response);
                        const cacheDir = path.join(__dirname, 'cache');
                        if (!fs.existsSync(cacheDir)) {
                            fs.mkdirSync(cacheDir, { recursive: true });
                        }
                        
                        const voicePath = path.join(cacheDir, `voice_${senderID}.mp3`);
                        await fs.writeFile(voicePath, audioBuffer);
                        
                        const sent = await api.sendMessage({
                            body: response,
                            attachment: fs.createReadStream(voicePath)
                        }, threadID, messageID);
                        
                        if (sent) {
                            global.client.onReply.push({
                                name: this.name,
                                messageID: sent.messageID,
                                author: event.senderID,
                                isVoiceContext: true
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
                                isVoiceContext: false
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

    onLoad: async function() {
        await Promise.all([
            loadLearnedResponses(),
            loadConversationHistory(),
            loadMemoryBank(),
            loadGenderData(),
            loadFriendshipLevels(),
            loadElevenLabsConfig()
        ]);
    }
};