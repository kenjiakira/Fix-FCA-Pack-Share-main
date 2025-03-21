const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs-extra");
const axios = require("axios");

let API_KEYS = "";
const apiKeysPath = path.join(__dirname, "json", "chatbot", "key.json");

const loadAPIKeys = async () => {
    try {
        const data = await fs.readJson(apiKeysPath);
        API_KEYS = data.api_keys;
        API_KEYS = API_KEYS.filter(key => key && key.length > 0);
    } catch (error) {
        console.error("Error loading API keys:", error);
        API_KEYS = [];
    }
};

loadAPIKeys();

const GAME_REWARDS = [
    200000, 400000, 600000, 1000000, 2000000, 3000000, 6000000, 10000000, 14000000, 22000000,
    30000000, 40000000, 60000000, 85000000, 150000000
];
const QUESTION_SIMILARITY_THRESHOLD = 0.6;
const MIN_QUESTIONS_PER_LEVEL = 5;
const QUESTION_HISTORY_SIZE = 20;

const currentSessionQuestions = new Set();

const allCategories = ['khoa_hoc', 'lich_su', 'dia_ly', 'van_hoa', 'nghe_thuat', 'the_thao', 'khac'];

const questionsUsedInCurrentGame = new Map();

const GAME_STATES = {
    WAITING: 'waiting',
    PLAYING: 'playing',
    ENDED: 'ended'
};
const activeThreadGames = new Map();
let questionBankCache = {};
const GAME_TIMEOUT = 5 * 60 * 1000
const activeGames = new Map();

const userDataPath = path.join(__dirname, "..", "events", "cache", "userData.json");
const questionsDbPath = path.join(__dirname, "..", "database", "altp_questions.json");
const QUESTION_COOLDOWN = 24 * 60 * 60 * 1000;

function getPlayerName(userId) {
    try {
        const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
        return userData[userId]?.name || "Người chơi";
    } catch (error) {
        console.error("Error reading userData:", error);
        return "Người chơi";
    }
}
function extractKeywords(text) {
    const normalized = text.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // Mở rộng danh sách stopwords
    const stopwords = ['là', 'và', 'của', 'có', 'được', 'những', 'các', 'nào', 'ai', 'gì', 'nơi', 'tại', 'trong', 'khi',
        'mà', 'để', 'từ', 'với', 'đã', 'sẽ', 'nên', 'bởi', 'như', 'vì', 'trên', 'dưới', 'về', 'sau', 'theo',
        'hoặc', 'còn', 'đó', 'này', 'một', 'hai', 'ba', 'bốn', 'năm', 'mười', 'khoảng', 'cách', 'đến', 'rất'];

    const words = normalized.split(/\s+/);

    // Trích xuất nguyên văn cùng với từng từ
    let keywords = words.filter(word => word.length > 2 && !stopwords.includes(word));

    // Thêm cụm từ 2-3 từ liên tiếp (n-grams)
    for (let i = 0; i < words.length - 1; i++) {
        const bigram = words[i] + " " + words[i + 1];
        if (bigram.length > 5) keywords.push(bigram);

        if (i < words.length - 2) {
            const trigram = words[i] + " " + words[i + 1] + " " + words[i + 2];
            if (trigram.length > 8) keywords.push(trigram);
        }
    }

    return keywords;
}
function isSimilarQuestion(q1, q2) {
    // Trường hợp đơn giản: nội dung câu hỏi tương tự
    if (q1.question.toLowerCase().trim() === q2.question.toLowerCase().trim()) {
        return true;
    }

    // Kiểm tra câu trả lời trùng nhau
    const q1OptionsArray = Object.values(q1.options).map(opt => opt.toLowerCase().trim());
    const q2OptionsArray = Object.values(q2.options).map(opt => opt.toLowerCase().trim());

    // Đếm số câu trả lời trùng nhau
    let matchingOptions = 0;
    q1OptionsArray.forEach(opt1 => {
        if (q2OptionsArray.some(opt2 => opt2.includes(opt1) || opt1.includes(opt2))) {
            matchingOptions++;
        }
    });

    if (matchingOptions >= 2) {
        return true;
    }

    if (!q1.keywords) q1.keywords = extractKeywords(q1.question);
    if (!q2.keywords) q2.keywords = extractKeywords(q2.question);

    const commonKeywords = q1.keywords.filter(word => q2.keywords.includes(word));

    const similarity = commonKeywords.length /
        Math.max(1, q1.keywords.length + q2.keywords.length - commonKeywords.length);

    return similarity > 0.4;
}
async function loadQuestions() {
    try {
        await fs.ensureFile(questionsDbPath);
        const rawData = await fs.readFile(questionsDbPath, 'utf8');

        if (!rawData || rawData.trim() === '') {
            console.log("Questions database is empty. Initializing with default structure.");
            const defaultData = { questions: [], usageHistory: {} };
            await fs.writeJson(questionsDbPath, defaultData, { spaces: 2 });
            return defaultData;
        }

        try {
            const parsedData = JSON.parse(rawData);

            if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
                console.log("Invalid questions structure. Reinitializing.");
                parsedData.questions = [];
            }

            if (!parsedData.usageHistory || typeof parsedData.usageHistory !== 'object') {
                parsedData.usageHistory = {};
            }

            return parsedData;
        } catch (parseError) {
            console.error("JSON parse error:", parseError);

            const defaultData = { questions: [], usageHistory: {} };
            await fs.writeJson(questionsDbPath, defaultData, { spaces: 2 });
            return defaultData;
        }
    } catch (error) {
        console.error("Error loading questions:", error);
        return { questions: [], usageHistory: {} };
    }
}
async function selectQuestion(level, userId) {
    try {
        const data = await loadQuestions();
        const now = Date.now();
        const game = activeGames.get(userId);

        if (!data || !data.questions || !Array.isArray(data.questions)) {
            console.error("Invalid questions data structure");
            return generateNewQuestion(level, []);
        }

        const levelQuestions = data.questions.filter(q => q.level === level);
        console.log(`Total questions for level ${level}: ${levelQuestions.length}`);

        const unusedQuestions = levelQuestions.filter(q => {
            if (game && game.usedQuestionIds.includes(q.id)) {
                return false;
            }

            const lastUsed = data.usageHistory?.[q.id]?.[userId] || 0;
            return (now - lastUsed > QUESTION_COOLDOWN);
        });

        if (unusedQuestions.length > 0) {
            const shuffledQuestions = unusedQuestions.sort(() => 0.5 - Math.random());

            if (game && game.currentQuestion) {
                const differentAnswers = shuffledQuestions.filter(q =>
                    q.correct !== game.currentQuestion.correct
                );

                if (differentAnswers.length > 0) {
                    return pickRandomQuestion(differentAnswers, data, userId);
                }
            }

            return pickRandomQuestion(shuffledQuestions, data, userId);
        }

        console.log(`No available questions for level ${level}, generating new`);
        return generateNewQuestion(level, data.questions);
    } catch (error) {
        console.error("Error in selectQuestion:", error);
        return generateNewQuestion(level, []);
    }
}
function pickRandomQuestion(questions, data, userId) {
    const question = questions[0];
    const now = Date.now();

    if (!data.usageHistory) data.usageHistory = {};
    if (!data.usageHistory[question.id]) data.usageHistory[question.id] = {};
    data.usageHistory[question.id][userId] = now;

    fs.writeJson(questionsDbPath, data, { spaces: 2 }).catch(err =>
        console.error("Error saving question history:", err)
    );

    console.log(`Selected question ID: ${question.id} for level ${question.level}`);
    return question;
}
async function saveQuestion(questionData, level) {
    try {
        const questionId = 'q' + Date.now().toString();
        const data = await loadQuestions();

        const optionsArray = Object.values(questionData.options).map(opt => opt.trim());

        const newQuestion = {
            id: questionId,
            level: level,
            question: questionData.question,
            options: questionData.options,
            correct: questionData.correct,
            category: detectCategory(questionData.question),
            createdAt: Date.now(),
            keywords: extractKeywords(questionData.question),

            optionsText: optionsArray.join('|'),
            answerPattern: questionData.correct
        };

        if (data.questions && Array.isArray(data.questions)) {

            const isDuplicate = data.questions.some(q => isSimilarQuestion(q, newQuestion));
            if (isDuplicate) {
                console.log(`Duplicate question detected: "${questionData.question}"`);
                return generateNewQuestion(level, data.questions);
            }

            const recentQuestions = data.questions
                .filter(q => q.level === level)
                .slice(-8);
            const recentCorrectAnswers = recentQuestions.map(q => q.correct);
            const answerFrequency = {};

            recentCorrectAnswers.forEach(ans => {
                answerFrequency[ans] = (answerFrequency[ans] || 0) + 1;
            });

            if (recentCorrectAnswers.length >= 4 &&
                (answerFrequency[questionData.correct] || 0) >= 3) {
                console.log(`Answer pattern too repetitive: ${questionData.correct} appears too often`);
                return generateNewQuestion(level, data.questions);
            }

            const hasSimilarOptions = recentQuestions.some(q => {
                if (!q.options) return false;

                const qOptionsArray = Object.values(q.options).map(opt => opt.trim().toLowerCase());
                const newOptionsArray = optionsArray.map(opt => opt.trim().toLowerCase());

                let matchCount = 0;
                qOptionsArray.forEach(opt1 => {
                    newOptionsArray.forEach(opt2 => {
                        if (opt1.includes(opt2) || opt2.includes(opt1)) {
                            matchCount++;
                        }
                    });
                });

                return matchCount >= 2;
            });

            if (hasSimilarOptions) {
                console.log(`Similar options detected in question: "${questionData.question}"`);
                return generateNewQuestion(level, data.questions);
            }
        }

        if (!data.questions) data.questions = [];
        data.questions.push(newQuestion);
        const MAX_QUESTIONS_PER_LEVEL = 30;
        const questionsAtThisLevel = data.questions.filter(q => q.level === level);
        if (questionsAtThisLevel.length > MAX_QUESTIONS_PER_LEVEL) {
            const oldestQuestions = questionsAtThisLevel
                .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
                .slice(0, questionsAtThisLevel.length - MAX_QUESTIONS_PER_LEVEL);

            for (const oldQ of oldestQuestions) {
                data.questions = data.questions.filter(q => q.id !== oldQ.id);
             
                if (data.usageHistory && data.usageHistory[oldQ.id]) {
                    delete data.usageHistory[oldQ.id];
                }
            }
        }
        await fs.writeJson(questionsDbPath, data, { spaces: 2 });
        console.log(`Saved new question (ID: ${questionId}, Level: ${level}): "${questionData.question.substring(0, 50)}..."`);
        return newQuestion;
    } catch (error) {
        console.error("Error saving question:", error);
        return questionData;
    }
}

function detectCategory(question) {
    const categories = {
        'khoa_hoc': ['khoa học', 'vật lý', 'hóa học', 'sinh học', 'công nghệ', 'thiên văn', 'y học', 'toán học'],
        'lich_su': ['lịch sử', 'triều đại', 'vua', 'chiến tranh', 'cách mạng', 'thời kỳ', 'thế kỷ', 'năm'],
        'dia_ly': ['địa lý', 'quốc gia', 'thủ đô', 'châu lục', 'biển', 'núi', 'sông', 'thành phố'],
        'van_hoa': ['văn hóa', 'phong tục', 'lễ hội', 'tôn giáo', 'truyền thống', 'dân tộc', 'tập quán'],
        'nghe_thuat': ['nghệ thuật', 'âm nhạc', 'hội họa', 'điện ảnh', 'văn học', 'nhạc sĩ', 'họa sĩ', 'tác phẩm'],
        'the_thao': ['thể thao', 'bóng đá', 'olympic', 'vận động viên', 'giải đấu', 'kỷ lục', 'cầu thủ']
    };
    const questionLower = question.toLowerCase();


    let bestCategory = 'khac';
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(categories)) {
        const matches = keywords.filter(keyword => questionLower.includes(keyword)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            bestCategory = category;
        }
    }

    return bestCategory;
}

async function generateNewQuestion(level, existingQuestions) {
    try {
        const apiKey = API_KEYS[0];
        if (!apiKey) {
            throw new Error("No API key available");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.9,
                maxOutputTokens: 1000,
            }
        });
        const difficulty = level <= 5 ? "dễ" : level <= 10 ? "trung bình" : "khó";

        // Lấy thông tin về câu hỏi gần đây
        const recentQuestions = existingQuestions
            .filter(q => q.level === level)
            .slice(-5)
            .map(q => q.question);

        // Lấy thông tin về các đáp án gần đây
        const recentCorrectAnswers = existingQuestions
            .filter(q => q.level === level)
            .slice(-10)
            .map(q => q.correct);

        const answerCounts = { 'A': 0, 'B': 0, 'C': 0, 'D': 0 };
        recentCorrectAnswers.forEach(ans => {
            answerCounts[ans] = (answerCounts[ans] || 0) + 1;
        });

        const preferredAnswers = Object.entries(answerCounts)
            .sort((a, b) => a[1] - b[1])
            .map(entry => entry[0]);

        const recentKeywords = existingQuestions
            .filter(q => q.level === level)
            .slice(-10)
            .flatMap(q => q.keywords || extractKeywords(q.question))
            .filter((value, index, self) => self.indexOf(value) === index)
            .slice(0, 20);
        const recentCategories = existingQuestions
            .filter(q => q.level === level)
            .slice(-8)
            .map(q => q.category || detectCategory(q.question));

        const availableCategories = ['khoa_hoc', 'lich_su', 'dia_ly', 'van_hoa', 'nghe_thuat', 'the_thao', 'khac'];
        const categoryCount = {};
        availableCategories.forEach(cat => categoryCount[cat] = 0);
        recentCategories.forEach(cat => {
            if (categoryCount[cat] !== undefined) {
                categoryCount[cat]++;
            }
        });

        const preferredCategories = Object.entries(categoryCount)
            .sort((a, b) => a[1] - b[1])
            .map(entry => entry[0]);

        const prompt = `Tạo một câu hỏi HOÀN TOÀN MỚI và ĐỘC ĐÁO cho chương trình Ai Là Triệu Phú.
    
    YÊU CẦU:
    - Độ khó: ${difficulty} (Cấp độ ${level}/15)
    - TUYỆT ĐỐI KHÔNG được trùng lặp với các câu hỏi sau:
    ${recentQuestions.map(q => '  - ' + q).join('\n')}
    
    - Ưu tiên các chủ đề: ${preferredCategories.slice(0, 3).join(', ')}
    - TRÁNH các chủ đề: ${preferredCategories.slice(-2).join(', ')}
    - TRÁNH sử dụng các từ khóa sau trong câu hỏi và đáp án:
    ${recentKeywords.slice(0, 10).join(', ')}
    
    - ĐÁP ÁN ĐÚNG nên là một trong các chữ cái sau (ưu tiên theo thứ tự): ${preferredAnswers.join(', ')}
    - KHÔNG ĐƯỢC dùng đáp án ${preferredAnswers[3]} quá nhiều lần
    - Tạo các đáp án sai hợp lý nhưng khác biệt rõ ràng
    - Câu hỏi phải thú vị, chính xác, có tính giáo dục
    - Nếu là câu hỏi khó (cấp độ > 10), hãy tạo câu hỏi thực sự thách thức
    
    Đảm bảo các phương án trả lời:
    - KHÔNG trùng lặp với nhau
    - KHÔNG có cách diễn đạt tương tự nhau
    - Đủ ngắn gọn để dễ đọc
    - Mỗi phương án phải rõ ràng và riêng biệt
    
    Trả về kết quả là JSON thuần túy theo cấu trúc:
    {
      "question": "Nội dung câu hỏi",
      "options": {
        "A": "Đáp án A",
        "B": "Đáp án B", 
        "C": "Đáp án C",
        "D": "Đáp án D"
      },
      "correct": "A/B/C/D"
    }
    
    CHỈ TRẢ VỀ JSON, KHÔNG KÈM THEO BẤT KỲ GIẢI THÍCH HAY MARKDOWN NÀO!`;


        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let cleanJson = responseText;

        cleanJson = cleanJson.replace(/```(json|javascript)?\s*/g, '');
        cleanJson = cleanJson.replace(/```\s*$/g, '');

        cleanJson = cleanJson.trim();

        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }

        console.log("Cleaned JSON:", cleanJson);

        try {
            const questionData = JSON.parse(cleanJson);
            await saveQuestion(questionData, level);
            return questionData;
        } catch (parseError) {
            console.error("JSON parse error:", parseError);

            return {
                question: "Loại tiền tệ nào được sử dụng tại Nhật Bản?",
                options: {
                    A: "Yuan",
                    B: "Won",
                    C: "Yen",
                    D: "Rupee"
                },
                correct: "C"
            };
        }

    } catch (error) {
        console.error("Error generating question:", error);
        if (error.message?.includes('503') || error.message?.includes('overloaded')) {
            return {
                question: "Xin lỗi, hệ thống đang bận. Thử câu hỏi đơn giản này:",
                options: {
                    A: "Yuan",
                    B: "Won", 
                    C: "Yen",
                    D: "Rupee"
                },
                correct: "C"
            };
        }
        throw error;
    }
}

function initializeGame(userId) {
    return {
        state: 'playing',
        level: 1,
        currentQuestion: null,
        lifelines: {
            fifty: true,
            audience: true,
            call: true
        },
        startTime: Date.now(),
        lastQuestionTime: Date.now(),
        timerId: null,
        usedQuestionIds: []
    };
}


function useFiftyFifty(question) {
    const options = ['A', 'B', 'C', 'D'];
    const correctAnswer = question.correct;
    const wrongOptions = options.filter(opt => opt !== correctAnswer);

    for (let i = 0; i < 2; i++) {
        const randomIndex = Math.floor(Math.random() * wrongOptions.length);
        const optionToRemove = wrongOptions[randomIndex];
        question.options[optionToRemove] = '';
        wrongOptions.splice(randomIndex, 1);
    }

    return question;
}
async function resetAltpData() {
    try {
        const newData = {
            questions: [], 
            usageHistory: {}
        };
        
        await fs.writeJson(questionsDbPath, newData, { spaces: 2 });
        
        Object.keys(questionBankCache).forEach(key => delete questionBankCache[key]);
        currentSessionQuestions.clear();
        
        console.log("ALTP database has been reset");
        
        const NUM_LEVELS = 15;
        const QUESTIONS_PER_LEVEL = 3;
        
        for (let level = 1; level <= NUM_LEVELS; level++) {
            console.log(`Pre-generating ${QUESTIONS_PER_LEVEL} questions for level ${level}...`);
            
            try {
                setTimeout(async () => {
                    for (let i = 0; i < QUESTIONS_PER_LEVEL; i++) {
                        try {
                            await generateNewQuestion(level, []);
                        } catch (genError) {
                            console.error(`Error generating question for level ${level}:`, genError);
                        }
                    }
                }, 500 * level); 
            } catch (levelError) {
                console.error(`Error in level ${level} generation:`, levelError);
            }
        }
        
        return true;
    } catch (error) {
        console.error("Error resetting ALTP data:", error);
        throw error;
    }
}
function useAudienceHelp(question) {
    const correct = question.correct;
    const audienceVotes = {
        A: 0, B: 0, C: 0, D: 0
    };

    let correctVotes = 45 + Math.floor(Math.random() * 30);
    audienceVotes[correct] = correctVotes;

    let remainingVotes = 100 - correctVotes;
    Object.keys(audienceVotes).forEach(option => {
        if (option !== correct && question.options[option]) {
            const votes = Math.floor(Math.random() * remainingVotes);
            audienceVotes[option] = votes;
            remainingVotes -= votes;
        }
    });

    if (remainingVotes > 0) {
        const wrongOptions = Object.keys(audienceVotes).filter(opt =>
            opt !== correct && question.options[opt]
        );
        const randomWrong = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        audienceVotes[randomWrong] += remainingVotes;
    }

    return audienceVotes;
}

async function usePhoneCall(question, level) {
    try {
        const apiKeysPath = path.join(__dirname, "json", "chatbot", "key.json");
        const { api_keys } = await fs.readJson(apiKeysPath);
        const apiKey = api_keys[0];

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.9,
                maxOutputTokens: 1000,
            }
        });

        const prompt = `Với câu hỏi: "${question.question}"
    Các phương án:
    A. ${question.options.A}
    B. ${question.options.B}
    C. ${question.options.C}
    D. ${question.options.D}
    
    Hãy đóng vai một người bạn được gọi điện nhờ trợ giúp trong chương trình Ai Là Triệu Phú.
    - Độ chính xác phụ thuộc vào độ khó (level ${level}/15)
    - Đưa ra phân tích và suy luận
    - Có thể không chắc chắn hoàn toàn
    - Trả lời theo phong cách tự nhiên
    - KHÔNG được tiết lộ đáp án đúng
    `;

        const result = await model.generateContent(prompt);
        return result.response.text();

    } catch (error) {
        console.error("Error using phone call:", error);
        return "Xin lỗi, tôi không nghe rõ câu trả lời của người bạn...";
    }
}

module.exports = {
    name: "altp",
    usedby: 0,
    category: "Games",
    info: "Chơi Ai Là Triệu Phú",
    credits: "HNT",
    onPrefix: true,
    usages: "altp [start/help]",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        const args = target[0]?.toLowerCase();
        const playerName = getPlayerName(senderID);
        const adminData = require("../admin.json");

        if (args === "reset") {
            if (!adminData.adminUIDs.includes(senderID)) {
                return api.sendMessage("❌ Bạn không có quyền sử dụng lệnh này!", threadID, messageID);
            }

            try {
                await resetAltpData();
                return api.sendMessage(
                    "✅ Đã xóa lịch sử câu hỏi ALTP!\n" +
                    "Bot sẽ tạo câu hỏi mới khi có người chơi.",
                    threadID, messageID
                );
            } catch (error) {
                console.error("Error resetting ALTP data:", error);
                return api.sendMessage("❌ Lỗi khi xóa dữ liệu ALTP!", threadID, messageID);
            }
        }

        if (!args || args === "help") {
            return api.sendMessage(
                "🎮 AI LÀ TRIỆU PHÚ - GAME SHOW KIẾN THỨC\n\n" +
                "Cách chơi:\n" +
                "- altp start : Bắt đầu game mới\n" +
                "- Trả lời bằng cách nhắn A, B, C hoặc D\n\n" +
                "Trợ giúp (mỗi trợ giúp chỉ được dùng 1 lần):\n" +
                "- 50:50 : Loại bỏ 2 đáp án sai\n" +
                "- audience : Hỏi ý kiến khán giả\n" +
                "- call : Gọi điện thoại cho người thân\n\n" +
                "Phần thưởng tối đa: 150.000.000 đô",
                threadID, messageID
            );
        }

        if (args === "start") {
            if (activeGames.has(senderID)) {
                return api.sendMessage(`${playerName} đang có game đang chơi dở!`, threadID, messageID);
            }

            if (activeThreadGames.has(threadID)) {
                const currentPlayerId = activeThreadGames.get(threadID);
                const currentPlayerName = getPlayerName(currentPlayerId);

                return api.sendMessage(
                    `⚠️ Đã có người đang chơi trong nhóm này!\n\n` +
                    `👤 Người chơi: ${currentPlayerName}\n` +
                    `⏳ Vui lòng đợi đến khi game kết thúc.`,
                    threadID, messageID
                );
            }

            const game = initializeGame(senderID);
            try {
                const question = await selectQuestion(game.level, senderID);
                game.currentQuestion = question;
                game.usedQuestionIds.push(question.id);

                game.timerId = setTimeout(() => {
                    if (activeGames.has(senderID)) {
                        activeGames.delete(senderID);
                        activeThreadGames.delete(threadID);

                        api.sendMessage(
                            `⏱️ HẾT GIỜ!\n\n` +
                            `${playerName} đã không trả lời trong thời gian quy định.\n` +
                            `Câu hỏi: ${question.question}\n` +
                            `Đáp án đúng: ${question.correct}\n\n` +
                            `Game đã kết thúc ở câu ${game.level}/15.`,
                            threadID
                        );
                    }
                }, GAME_TIMEOUT);
                activeGames.set(senderID, game);
                activeThreadGames.set(threadID, senderID);

                const msg = await api.sendMessage(
                    `🎮 AI LÀ TRIỆU PHÚ - ${playerName}\nCâu ${game.level}/15\n\n` +
                    `Phần thưởng: ${GAME_REWARDS[game.level - 1]} coins\n\n` +
                    `${question.question}\n\n` +
                    `A. ${question.options.A}\n` +
                    `B. ${question.options.B}\n` +
                    `C. ${question.options.C}\n` +
                    `D. ${question.options.D}\n\n` +
                    "Trợ giúp: 50:50 | audience | call",
                    threadID, messageID
                );

                global.client.onReply.push({
                    name: this.name,
                    messageID: msg.messageID,
                    author: senderID,
                    type: "answer"
                });
            } catch (error) {
                console.error(error);
                return api.sendMessage("Có lỗi xảy ra khi tạo câu hỏi, vui lòng thử lại!", threadID, messageID);
            }
        }
    },

    onReply: async function ({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        const answer = body.trim().toUpperCase();

        if (!activeGames.has(senderID)) return;

        const game = activeGames.get(senderID);
        const question = game.currentQuestion;
        const playerName = getPlayerName(senderID);

        if (answer === "STOP") {

            if (game.timerId) clearTimeout(game.timerId);

            let reward = 0;
            if (game.level > 1) {

                const previousLevel = game.level - 1;
                reward = GAME_REWARDS[previousLevel - 1];
            }

            activeGames.delete(senderID);
            activeThreadGames.delete(threadID);

            return api.sendMessage(
                `🛑 ${playerName} ĐÃ DỪNG CUỘC CHƠI!\n\n` +
                `Câu hỏi hiện tại: ${question.question}\n` +
                `Đáp án đúng là: ${question.correct}\n\n` +
                `Phần thưởng nhận được: ${reward.toLocaleString()} coins\n` +
                `Số câu đã trả lời đúng: ${game.level - 1}/15`,
                threadID, messageID
            );
        }

        if (game.timerId) clearTimeout(game.timerId);

        game.timerId = setTimeout(() => {
            if (activeGames.has(senderID)) {
                activeGames.delete(senderID);
                activeThreadGames.delete(threadID);

                api.sendMessage(
                    `⏱️ HẾT GIỜ!\n\n` +
                    `${playerName} đã không trả lời trong thời gian quy định.\n` +
                    `Câu hỏi: ${question.question}\n` +
                    `Đáp án đúng: ${question.correct}\n\n` +
                    `Game đã kết thúc ở câu ${game.level}/15.`,
                    threadID
                );
            }
        }, GAME_TIMEOUT);

        if (answer === "50:50" && game.lifelines.fifty) {
            game.lifelines.fifty = false;
            const modifiedQuestion = useFiftyFifty({ ...question });

            const msg = await api.sendMessage(
                `🎮 AI LÀ TRIỆU PHÚ - ${playerName}\nCâu ${game.level}/15\n\n` +
                `Phần thưởng: ${GAME_REWARDS[game.level - 1]} coins\n\n` +
                `${question.question}\n\n` +
                `A. ${modifiedQuestion.options.A}\n` +
                `B. ${modifiedQuestion.options.B}\n` +
                `C. ${modifiedQuestion.options.C}\n` +
                `D. ${modifiedQuestion.options.D}\n\n` +
                `Trợ giúp còn lại: ${game.lifelines.audience ? 'audience | ' : ''}${game.lifelines.call ? 'call' : ''}`,
                threadID, messageID
            );

            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: senderID,
                type: "answer"
            });
        }

        if (answer === "AUDIENCE" && game.lifelines.audience) {
            game.lifelines.audience = false;
            const audienceVotes = useAudienceHelp(question);

            const msg = await api.sendMessage(
                "📊 Ý KIẾN KHÁN GIẢ:\n\n" +
                `A. ${audienceVotes.A}%\n` +
                `B. ${audienceVotes.B}%\n` +
                `C. ${audienceVotes.C}%\n` +
                `D. ${audienceVotes.D}%\n\n` +
                `Trợ giúp còn lại: ${game.lifelines.fifty ? '50:50 | ' : ''}${game.lifelines.call ? 'call' : ''}`,
                threadID, messageID
            );

            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: senderID,
                type: "answer"
            });
        }

        if (answer === "CALL" && game.lifelines.call) {
            game.lifelines.call = false;
            const response = await usePhoneCall(question, game.level);

            const msg = await api.sendMessage(
                "📱 GỌI ĐIỆN THOẠI CHO NGƯỜI THÂN:\n\n" +
                response + "\n\n" +
                `Trợ giúp còn lại: ${game.lifelines.fifty ? '50:50 | ' : ''}${game.lifelines.audience ? 'audience' : ''}`,
                threadID, messageID
            );  

            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: senderID,
                type: "answer"
            });
        }

        if (!["A", "B", "C", "D"].includes(answer)) return;

        if (answer === question.correct) {
            if (game.level === 15) {

                if (game.timerId) clearTimeout(game.timerId);
                activeGames.delete(senderID);
                activeThreadGames.delete(threadID);

                return api.sendMessage(
                    `🎉 CHÚC MỪNG ${playerName} ĐÃ CHIẾN THẮNG!\n\n` +
                    `Phần thưởng: ${GAME_REWARDS[14]} coins\n` +
                    "Bạn đã trở thành triệu phú! 🏆",
                    threadID, messageID
                );
            }

            game.level++;
            try {
                const nextQuestion = await selectQuestion(game.level, senderID);
                game.currentQuestion = nextQuestion;
                game.usedQuestionIds.push(nextQuestion.id);

                if (nextQuestion.question === question.question) {
                    console.log("Detected duplicate question content! Generating new question...");
                    try {
                        const brandNewQuestion = await generateNewQuestion(game.level, data.questions || []);
                        game.currentQuestion = brandNewQuestion;
                        game.usedQuestionIds.push(brandNewQuestion.id);
                    } catch (error) {
                        console.error("Error generating replacement question:", error);
                        game.currentQuestion = nextQuestion;
                        game.usedQuestionIds.push(nextQuestion.id);
                    }
                } else {
                    game.currentQuestion = nextQuestion;
                    game.usedQuestionIds.push(nextQuestion.id);
                }

                const msg = await api.sendMessage(
                    `✅ CHÍNH XÁC!\n\n` +
                    `🎮 AI LÀ TRIỆU PHÚ - ${playerName}\nCâu ${game.level}/15\n` +
                    `Phần thưởng: ${GAME_REWARDS[game.level - 1]} coins\n\n` +
                    `${nextQuestion.question}\n\n` +
                    `A. ${nextQuestion.options.A}\n` +
                    `B. ${nextQuestion.options.B}\n` +
                    `C. ${nextQuestion.options.C}\n` +
                    `D. ${nextQuestion.options.D}\n\n` +
                    `Trợ giúp: ${game.lifelines.fifty ? '50:50 | ' : ''}${game.lifelines.audience ? 'audience | ' : ''}${game.lifelines.call ? 'call' : ''}`,
                    threadID, messageID
                );

                global.client.onReply.push({
                    name: this.name,
                    messageID: msg.messageID,
                    author: senderID,
                    type: "answer"
                });
            } catch (error) {
                console.error(error);
                return api.sendMessage("Có lỗi xảy ra khi tạo câu hỏi, buộc phải dừng cuộc chơi!", threadID, messageID);
            }
        } else {
            if (game.timerId) clearTimeout(game.timerId);
            const reward = game.level > 5 ? GAME_REWARDS[4] : 0;
            activeGames.delete(senderID);
            activeThreadGames.delete(threadID);

            return api.sendMessage(
                `❌ ${playerName} TRẢ LỜI SAI!\nĐáp án đúng là ${question.correct}\n\n` +
                `Game over! Phần thưởng ra về: ${reward} coins\n` +
                `Số câu đã trả lời đúng: ${game.level - 1}/15`,
                threadID, messageID
            );
        }
    }
};
