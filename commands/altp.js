const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs-extra");
const { updateBalance } = require('../utils/currencies');

const API_KEYS = JSON.parse(fs.readFileSync(path.join(__dirname, "./json/chatbot/key.json"))).api_keys;
const QUESTIONS_FILE = path.join(__dirname, './json/altp/questions.json');
const HISTORY_FILE = path.join(__dirname, './json/altp/history.json');

fs.ensureDirSync(path.dirname(QUESTIONS_FILE));
fs.ensureDirSync(path.dirname(HISTORY_FILE));

const altpSessions = new Map();

const PRIZE_AMOUNTS = [
    200, 400, 600, 1000, 2000,         
    3000, 6000, 10000, 14000, 22000,     // Questions 6-10
    30000, 40000, 60000, 85000, 150000   // Questions 11-15
];

// Safe checkpoints (questions indexed from 0)
const SAFE_CHECKPOINTS = [4, 9, 14]; // Question 5, 10, and 15

// Load questions database
let questionsDB = [];
try {
    questionsDB = fs.readJsonSync(QUESTIONS_FILE, { throws: false }) || [];
} catch (error) {
    fs.writeJsonSync(QUESTIONS_FILE, []);
}

// Get questions by difficulty level (1-15)
const getQuestionsByLevel = (level) => {
    return questionsDB.filter(q => q.level === level);
};

// Save a new question to the database
const saveQuestion = async (question) => {
    // Check for duplicates
    const isDuplicate = questionsDB.some(q => 
        q.question.toLowerCase().replace(/\s+/g, '') === 
        question.question.toLowerCase().replace(/\s+/g, '')
    );
    
    if (!isDuplicate) {
        questionsDB.push(question);
        
        console.log(`Saved new ALTP question: ${question.id}`);
        console.log(`Total ALTP questions: ${questionsDB.length}`);
        
        try {
            await fs.writeJsonSync(QUESTIONS_FILE, questionsDB);
            return true;
        } catch (error) {
            console.error("Error saving question:", error);
            return false;
        }
    }
    return false;
};

// Get a random question for a specific level
const getRandomQuestion = (level) => {
    const questionsForLevel = getQuestionsByLevel(level);
    
    // If no questions for this level, return null
    if (questionsForLevel.length === 0) return null;
    
    // Get a random question from this level
    return questionsForLevel[Math.floor(Math.random() * questionsForLevel.length)];
};

// Shuffle answers
const shuffleAnswers = (question) => {
    // Create array of options
    const options = [
        { key: 'A', text: question.options.A, isCorrect: question.correct === 'A' },
        { key: 'B', text: question.options.B, isCorrect: question.correct === 'B' },
        { key: 'C', text: question.options.C, isCorrect: question.correct === 'C' },
        { key: 'D', text: question.options.D, isCorrect: question.correct === 'D' }
    ];
    
    // Shuffle array
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    // Create new mapping with shuffled positions
    const newOptions = {
        A: options[0].text,
        B: options[1].text,
        C: options[2].text,
        D: options[3].text
    };
    
    // Find correct answer after shuffling
    let correctAnswer = 'A'; // Default
    if (options[1].isCorrect) correctAnswer = 'B';
    else if (options[2].isCorrect) correctAnswer = 'C';
    else if (options[3].isCorrect) correctAnswer = 'D';
    
    // Update question with shuffled options
    const shuffledQuestion = {
        ...question,
        options: newOptions,
        correct: correctAnswer
    };
    
    return shuffledQuestion;
};

// Generate a new question with specified level
const generateQuestion = async (level) => {
    // Difficulty increases with level
    let difficulty = "dễ";
    if (level >= 5 && level < 10) difficulty = "trung bình";
    else if (level >= 10) difficulty = "khó";
    
    const genAI = new GoogleGenerativeAI(API_KEYS[0]);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Tạo câu hỏi trắc nghiệm cho game Ai Là Triệu Phú:

    Độ khó: ${difficulty} (Câu hỏi cấp độ ${level}/15)
    
    QUY TẮC:
    1. Câu hỏi phải khách quan, có thể kiểm chứng được.
    2. Phải có một đáp án đúng duy nhất.
    3. Các phương án phải rõ ràng, không gây nhầm lẫn.
    4. Độ dài câu hỏi và các đáp án tương đương nhau.
    5. Nội dung câu hỏi phải phù hợp với độ khó cấp độ ${level}/15.
    
    CÁC CHỦ ĐỀ:
    - Kiến thức chung
    - Lịch sử, địa lý
    - Khoa học, công nghệ
    - Văn hóa, nghệ thuật
    - Thể thao
    - Thời sự
    
    Định dạng trả về:
    Q: [câu hỏi rõ ràng, súc tích]
    A: [phương án 1]
    B: [phương án 2]
    C: [phương án 3]
    D: [phương án 4]
    Correct: [chữ cái đáp án đúng: A, B, C hoặc D]`;

    let attempts = 0;
    let question;
    
    // Try up to 3 times to generate a valid question
    while (attempts < 3) {
        try {
            const result = await model.generateContent(prompt);
            const response = result.response.text();
            
            if (!response) {
                console.error("Empty API response");
                attempts++;
                continue;
            }
            
            const lines = response.split('\n').filter(line => line.trim() !== '');
            
            // Check output format
            if (lines.length < 6) {
                console.error(`Invalid output format: ${response}`);
                attempts++;
                continue;
            }
            
            question = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                level: level,
                question: lines[0].replace(/^Q:/, '').trim(),
                options: {
                    A: lines[1].replace(/^A:/, '').trim(),
                    B: lines[2].replace(/^B:/, '').trim(),
                    C: lines[3].replace(/^C:/, '').trim(),
                    D: lines[4].replace(/^D:/, '').trim()
                },
                correct: lines[5].replace(/^Correct:/, '').trim()
            };

            // Validate question
            const isValid = 
                question.question && 
                question.options.A && 
                question.options.B && 
                question.options.C && 
                question.options.D &&
                ["A", "B", "C", "D"].includes(question.correct);

            if (isValid) {
                // Shuffle answers before saving
                question = shuffleAnswers(question);
                const saved = await saveQuestion(question);
                if (saved) {
                    console.log(`Successfully saved level ${level} question`);
                    break;
                }
            } else {
                console.error("Invalid question:", question);
            }
        } catch (error) {
            console.error("Error generating question:", error);
        }
        
        attempts++;
    }

    if (attempts >= 3) {
        throw new Error(`Failed to generate level ${level} question after 3 attempts`);
    }

    return question;
};

// Get or generate a question for a specific level
const getOrGenerateQuestion = async (level) => {
    // Try to get an existing question first
    let question = getRandomQuestion(level);
    
    // If no question available, generate a new one
    if (!question) {
        console.log(`Generating new question for level ${level}...`);
        question = await generateQuestion(level);
    } else {
        // Shuffle answers for existing questions
        question = shuffleAnswers(question);
    }
    
    return question;
};

// Use 50:50 lifeline - remove two incorrect answers
const useFiftyFifty = (session) => {
    const currentQuestion = session.questions[session.currentLevel - 1];
    const correctOption = currentQuestion.correct;
    
    // Get all incorrect options
    const incorrectOptions = Object.keys(currentQuestion.options)
        .filter(opt => opt !== correctOption);
    
    // Randomly select which incorrect options to keep (only 1)
    const keepOption = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
    
    // Create a filtered options object
    const filteredOptions = {
        [correctOption]: currentQuestion.options[correctOption],
        [keepOption]: currentQuestion.options[keepOption]
    };
    
    // Return information about removed options
    const removedOptions = incorrectOptions.filter(opt => opt !== keepOption);
    
    return {
        filteredOptions,
        removedOptions
    };
};

// Ask the audience lifeline - simulate audience voting
const askTheAudience = (session) => {
    const currentQuestion = session.questions[session.currentLevel - 1];
    const correctOption = currentQuestion.correct;
    
    // Base percentages based on question difficulty
    let correctPercentage;
    if (session.currentLevel <= 5) {
        correctPercentage = 65 + Math.floor(Math.random() * 15); // 65-80%
    } else if (session.currentLevel <= 10) {
        correctPercentage = 50 + Math.floor(Math.random() * 20); // 50-70%
    } else {
        correctPercentage = 40 + Math.floor(Math.random() * 15); // 40-55%
    }
    
    // Distribute remaining percentage among incorrect options
    const remainingPercentage = 100 - correctPercentage;
    const audienceVotes = {
        A: 0, B: 0, C: 0, D: 0
    };
    
    // Assign correct option percentage
    audienceVotes[correctOption] = correctPercentage;
    
    // Randomly distribute remaining percentage
    const incorrectOptions = ['A', 'B', 'C', 'D'].filter(opt => opt !== correctOption);
    let remaining = remainingPercentage;
    
    for (let i = 0; i < 2; i++) {
        const randPercent = Math.floor(Math.random() * remaining);
        audienceVotes[incorrectOptions[i]] = randPercent;
        remaining -= randPercent;
    }
    
    // Last option gets whatever is left
    audienceVotes[incorrectOptions[2]] = remaining;
    
    return audienceVotes;
};

// Call a friend lifeline - simulated friend response
const callAFriend = (session) => {
    const currentQuestion = session.questions[session.currentLevel - 1];
    const correctOption = currentQuestion.correct;
    
    // Chance of friend knowing the correct answer based on difficulty
    let correctChance;
    if (session.currentLevel <= 5) {
        correctChance = 0.9; // 90%
    } else if (session.currentLevel <= 10) {
        correctChance = 0.7; // 70%
    } else {
        correctChance = 0.5; // 50%
    }
    
    // Determine if friend knows the answer
    const friendIsCorrect = Math.random() < correctChance;
    
    if (friendIsCorrect) {
        // Friend gives correct answer with some confidence
        const confidence = ["Tôi chắc chắn", "Tôi khá chắc", "Tôi nghĩ", "Có thể là"];
        const confidenceLevel = confidence[Math.floor(Math.random() * (session.currentLevel > 10 ? 4 : 3))];
        return {
            answer: correctOption,
            message: `${confidenceLevel} đáp án là ${correctOption}`
        };
    } else {
        // Friend guesses wrong
        const incorrectOptions = ['A', 'B', 'C', 'D'].filter(opt => opt !== correctOption);
        const wrongGuess = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
        return {
            answer: wrongGuess,
            message: `Tôi không chắc lắm, nhưng có thể là ${wrongGuess}`
        };
    }
};

// Format money with commas
const formatMoney = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

module.exports = {
    name: "altp",
    dev: "HNT",
    usedby: 0,
    category: "Games",
    info: "Ai Là Triệu Phú",
    usages: "altp [start/quit/help]",
    onPrefix: true,
    cooldowns: 10,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        const command = target[0]?.toLowerCase();

        try {
            // Help command
            if (command === "help" || !command) {
                return api.sendMessage(
                    "🎮 AI LÀ TRIỆU PHÚ - HƯỚNG DẪN 🎮\n\n" +
                    "- altp start: Bắt đầu trò chơi mới\n" +
                    "- altp quit: Dừng trò chơi và nhận thưởng\n\n" +
                    "TRỢ GIÚP TRONG GAME:\n" +
                    "- 5050: Loại bỏ hai phương án sai\n" +
                    "- asking: Hỏi ý kiến khán giả\n" +
                    "- call: Gọi điện thoại cho người thân\n\n" +
                    "Trả lời bằng cách nhập A, B, C hoặc D\n" +
                    "Có 2 mốc an toàn: Câu 5 (2,000$) và Câu 10 (22,000$)",
                    threadID, messageID
                );
            }

            // Check if a game is already in progress
            if (altpSessions.has(threadID) && command !== "quit") {
                return api.sendMessage(
                    "⚠️ Đã có một phiên Ai Là Triệu Phú đang diễn ra!\n" +
                    "Gõ 'altp quit' để kết thúc phiên hiện tại.",
                    threadID, messageID
                );
            }

            if (command === "quit") {
                const session = altpSessions.get(threadID);
                
                if (!session) {
                    return api.sendMessage(
                        "⚠️ Không có phiên Ai Là Triệu Phú nào đang diễn ra!",
                        threadID, messageID
                    );
                }
                
                // Check if player is the same as who started the game
                if (session.playerID !== senderID) {
                    return api.sendMessage(
                        "⚠️ Chỉ người chơi hiện tại mới có thể dừng cuộc chơi!",
                        threadID, messageID
                    );
                }
                
                // Calculate prize based on current level
                const currentLevel = session.currentLevel - 1; // Adjust to 0-based index
                let prize = 0;
                
                if (currentLevel >= 1) {
                    prize = PRIZE_AMOUNTS[currentLevel - 1];
                }
                
                // Update player's balance
                updateBalance(senderID, prize);
                
                // Send message about quitting and prize
                api.sendMessage(
                    `🏆 Bạn đã quyết định dừng cuộc chơi ở câu hỏi số ${currentLevel}!\n` +
                    `💰 Phần thưởng nhận được: ${formatMoney(prize)}$`,
                    threadID, messageID
                );
                
                // Remove session
                altpSessions.delete(threadID);
                return;
            }

            // Start a new game
            if (command === "start") {
                // Initialize questions array for all 15 levels
                const questions = [];
                
                // Generate/get questions for level 1
                const firstQuestion = await getOrGenerateQuestion(1);
                questions.push(firstQuestion);
                
                // Create new session
                const session = {
                    playerID: senderID,
                    playerName: event.senderName || "Người chơi",
                    currentLevel: 1,
                    questions: questions,
                    lifelines: {
                        fiftyFifty: true,
                        audience: true,
                        phone: true
                    },
                    timestamp: Date.now()
                };
                
                altpSessions.set(threadID, session);
                
                // Prepare first question message
                const currentQuestion = session.questions[0];
                
                // Send welcome message
                await api.sendMessage(
                    "🎮 AI LÀ TRIỆU PHÚ 🎮\n\n" +
                    `Chào mừng ${session.playerName} đến với Ai Là Triệu Phú!\n` +
                    "Hãy trả lời đúng 15 câu hỏi để trở thành triệu phú!\n\n" +
                    "TRỢ GIÚP CÓ SẴN:\n" +
                    "- 5050: Loại bỏ hai phương án sai\n" +
                    "- asking: Hỏi ý kiến khán giả\n" +
                    "- call: Gọi điện thoại cho người thân\n\n" +
                    "Để dừng cuộc chơi và nhận thưởng, gõ 'altp quit'\n" +
                    "Chuẩn bị cho câu hỏi đầu tiên...",
                    threadID
                );
                
                // Wait 3 seconds
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Send first question
                const questionMsg = `❓ CÂU HỎI SỐ 1 (${formatMoney(PRIZE_AMOUNTS[0])}$)\n\n` +
                                  `${currentQuestion.question}\n\n` +
                                  `A. ${currentQuestion.options.A}\n` +
                                  `B. ${currentQuestion.options.B}\n` +
                                  `C. ${currentQuestion.options.C}\n` +
                                  `D. ${currentQuestion.options.D}\n\n` +
                                  `🔍 Trả lời: A, B, C, D hoặc dùng trợ giúp: 5050, asking, call`;
                
                const sent = await api.sendMessage(questionMsg, threadID);
                
                // Add message to onReply
                global.client.onReply.push({
                    name: this.name,
                    messageID: sent.messageID,
                    author: senderID
                });
                
                return;
            }
            
            // If no valid command
            return api.sendMessage(
                "⚠️ Lệnh không hợp lệ. Sử dụng 'altp help' để xem hướng dẫn.",
                threadID, messageID
            );

        } catch (error) {
            console.error("ALTP error:", error);
            api.sendMessage(
                "❌ Có lỗi xảy ra, vui lòng thử lại sau!",
                threadID, messageID
            );
        }
    },

    onReply: async function({ api, event, target, Users }) {
        const { threadID, messageID, senderID, body } = event;
        const session = altpSessions.get(threadID);

        if (!session || session.playerID !== senderID) return;

        try {
            const response = body.trim().toLowerCase();
            
            // Use lifelines
            if (response === "5050" && session.lifelines.fiftyFifty) {
                // Use 50:50 lifeline
                session.lifelines.fiftyFifty = false;
                
                const result = useFiftyFifty(session);
                const currentQuestion = session.questions[session.currentLevel - 1];
                
                const remainingOptions = Object.keys(result.filteredOptions).sort();
                const removedOptionsText = result.removedOptions.sort().join(" và ");
                
                // Create new question message with only remaining options
                let questionMsg = `❓ CÂU HỎI SỐ ${session.currentLevel} (${formatMoney(PRIZE_AMOUNTS[session.currentLevel - 1])}$)\n\n` +
                                  `${currentQuestion.question}\n\n`;
                
                // Add all options, but mark removed ones
                if (result.filteredOptions.A) {
                    questionMsg += `A. ${currentQuestion.options.A}\n`;
                } else {
                    questionMsg += `A. [Đã loại bỏ]\n`;
                }
                
                if (result.filteredOptions.B) {
                    questionMsg += `B. ${currentQuestion.options.B}\n`;
                } else {
                    questionMsg += `B. [Đã loại bỏ]\n`;
                }
                
                if (result.filteredOptions.C) {
                    questionMsg += `C. ${currentQuestion.options.C}\n`;
                } else {
                    questionMsg += `C. [Đã loại bỏ]\n`;
                }
                
                if (result.filteredOptions.D) {
                    questionMsg += `D. ${currentQuestion.options.D}\n`;
                } else {
                    questionMsg += `D. [Đã loại bỏ]\n`;
                }
                
                questionMsg += `\n🔍 Đã sử dụng quyền trợ giúp 50:50. Loại bỏ phương án ${removedOptionsText}`;
                questionMsg += `\n🔍 Trả lời: A, B, C, D hoặc dùng trợ giúp: ${session.lifelines.audience ? "asking, " : ""}${session.lifelines.phone ? "call" : ""}`;
                
                const sent = await api.sendMessage(questionMsg, threadID);
                
                // Add new message to onReply
                global.client.onReply.push({
                    name: this.name,
                    messageID: sent.messageID,
                    author: senderID
                });
                
                return;
            }
            else if (response === "asking" && session.lifelines.audience) {
                // Use Ask the Audience lifeline
                session.lifelines.audience = false;
                
                const audienceVotes = askTheAudience(session);
                const currentQuestion = session.questions[session.currentLevel - 1];
                
                // Create audience poll message
                let pollMsg = `📊 KẾT QUẢ HỎI Ý KIẾN KHÁN GIẢ:\n\n`;
                pollMsg += `A: ${audienceVotes.A}%\n`;
                pollMsg += `B: ${audienceVotes.B}%\n`;
                pollMsg += `C: ${audienceVotes.C}%\n`;
                pollMsg += `D: ${audienceVotes.D}%\n\n`;
                
                // Send audience poll results
                await api.sendMessage(pollMsg, threadID);
                
                // Resend the current question
                const questionMsg = `❓ CÂU HỎI SỐ ${session.currentLevel} (${formatMoney(PRIZE_AMOUNTS[session.currentLevel - 1])}$)\n\n` +
                                  `${currentQuestion.question}\n\n` +
                                  `A. ${currentQuestion.options.A}\n` +
                                  `B. ${currentQuestion.options.B}\n` +
                                  `C. ${currentQuestion.options.C}\n` +
                                  `D. ${currentQuestion.options.D}\n\n` +
                                  `🔍 Trả lời: A, B, C, D hoặc dùng trợ giúp: ${session.lifelines.fiftyFifty ? "5050, " : ""}${session.lifelines.phone ? "call" : ""}`;
                
                const sent = await api.sendMessage(questionMsg, threadID);
                
                // Add new message to onReply
                global.client.onReply.push({
                    name: this.name,
                    messageID: sent.messageID,
                    author: senderID
                });
                
                return;
            }
            else if (response === "call" && session.lifelines.phone) {
                // Use Phone a Friend lifeline
                session.lifelines.phone = false;
                
                const friendResponse = callAFriend(session);
                const currentQuestion = session.questions[session.currentLevel - 1];
                
                // Send friend's response
                await api.sendMessage(
                    `📞 GỌI ĐIỆN CHO NGƯỜI THÂN\n\n` +
                    `👫 Người thân trả lời: "${friendResponse.message}"`,
                    threadID
                );
                
                // Resend the current question
                const questionMsg = `❓ CÂU HỎI SỐ ${session.currentLevel} (${formatMoney(PRIZE_AMOUNTS[session.currentLevel - 1])}$)\n\n` +
                                  `${currentQuestion.question}\n\n` +
                                  `A. ${currentQuestion.options.A}\n` +
                                  `B. ${currentQuestion.options.B}\n` +
                                  `C. ${currentQuestion.options.C}\n` +
                                  `D. ${currentQuestion.options.D}\n\n` +
                                  `🔍 Trả lời: A, B, C, D hoặc dùng trợ giúp: ${session.lifelines.fiftyFifty ? "5050, " : ""}${session.lifelines.audience ? "asking" : ""}`;
                
                const sent = await api.sendMessage(questionMsg, threadID);
                
                // Add new message to onReply
                global.client.onReply.push({
                    name: this.name,
                    messageID: sent.messageID,
                    author: senderID
                });
                
                return;
            }
            
            // Check answer
            const validAnswers = ["a", "b", "c", "d"];
            if (!validAnswers.includes(response)) {
                return api.sendMessage(
                    "⚠️ Câu trả lời không hợp lệ. Vui lòng chỉ trả lời A, B, C, D hoặc sử dụng trợ giúp.",
                    threadID, messageID
                );
            }
            
            const currentQuestion = session.questions[session.currentLevel - 1];
            const playerAnswer = response.toUpperCase();
            
            if (playerAnswer === currentQuestion.correct) {
                // Correct answer
                const currentPrize = PRIZE_AMOUNTS[session.currentLevel - 1];
                
                // Check if this was the final question
                if (session.currentLevel === 15) {
                    // Player won the game!
                    updateBalance(senderID, PRIZE_AMOUNTS[14]); // Give the grand prize
                    
                    await api.sendMessage(
                        `🎊 CHÚC MỪNG BẠN ĐÃ TRỞ THÀNH TRIỆU PHÚ! 🎊\n\n` +
                        `✅ Bạn đã trả lời đúng tất cả 15 câu hỏi!\n` +
                        `💰 Phần thưởng: ${formatMoney(PRIZE_AMOUNTS[14])}$\n\n` +
                        `Cảm ơn bạn đã tham gia Ai Là Triệu Phú!`,
                        threadID
                    );
                    
                    // End the game
                    altpSessions.delete(threadID);
                    return;
                }
                
                // Not the final question, proceed to next level
                // Prepare congratulation message
                let congratsMsg = `✅ CHÍNH XÁC!\n`;
                congratsMsg += `💰 Bạn đã đạt mức ${formatMoney(currentPrize)}$\n\n`;
                
                // Check if player reached a checkpoint
                if (SAFE_CHECKPOINTS.includes(session.currentLevel - 1)) {
                    congratsMsg += `🔒 Bạn đã đạt mốc an toàn ${formatMoney(currentPrize)}$\n\n`;
                }
                
                // Send congrats message
                await api.sendMessage(congratsMsg, threadID);
                
                // Prepare for next question
                session.currentLevel++;
                
                // Check if we need to generate/get the next question
                if (!session.questions[session.currentLevel - 1]) {
                    const nextQuestion = await getOrGenerateQuestion(session.currentLevel);
                    session.questions.push(nextQuestion);
                }
                
                // Prepare next question message
                const nextQuestion = session.questions[session.currentLevel - 1];
                const nextPrize = PRIZE_AMOUNTS[session.currentLevel - 1];
                
                // Wait 3 seconds before sending the next question
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Send next question
                const questionMsg = `❓ CÂU HỎI SỐ ${session.currentLevel} (${formatMoney(nextPrize)}$)\n\n` +
                                  `${nextQuestion.question}\n\n` +
                                  `A. ${nextQuestion.options.A}\n` +
                                  `B. ${nextQuestion.options.B}\n` +
                                  `C. ${nextQuestion.options.C}\n` +
                                  `D. ${nextQuestion.options.D}\n\n` +
                                  `🔍 Trả lời: A, B, C, D hoặc dùng trợ giúp: ` +
                                  `${session.lifelines.fiftyFifty ? "5050, " : ""}` +
                                  `${session.lifelines.audience ? "asking, " : ""}` +
                                  `${session.lifelines.phone ? "call" : ""}`;
                
                const sent = await api.sendMessage(questionMsg, threadID);
                
                // Add new message to onReply
                global.client.onReply.push({
                    name: this.name,
                    messageID: sent.messageID,
                    author: senderID
                });
                
            } else {
                // Wrong answer - game over
                // Calculate prize based on checkpoints
                let finalPrize = 0;
                
                // Find the highest checkpoint the player passed
                for (const checkpoint of SAFE_CHECKPOINTS) {
                    if (session.currentLevel - 1 > checkpoint) {
                        finalPrize = PRIZE_AMOUNTS[checkpoint];
                    }
                }
                
                // Update player's balance
                updateBalance(senderID, finalPrize);
                
                // Send game over message
                await api.sendMessage(
                    `❌ Rất tiếc, câu trả lời không chính xác!\n\n` +
                    `📝 Câu hỏi: ${currentQuestion.question}\n` +
                    `✅ Đáp án đúng: ${currentQuestion.correct}. ${currentQuestion.options[currentQuestion.correct]}\n\n` +
                    `💰 Phần thưởng nhận được: ${formatMoney(finalPrize)}$\n\n` +
                    `Cảm ơn bạn đã tham gia Ai Là Triệu Phú!`,
                    threadID
                );
                
                // End the game
                altpSessions.delete(threadID);
            }
            
        } catch (error) {
            console.error("ALTP onReply error:", error);
            api.sendMessage(
                "❌ Có lỗi xảy ra trong quá trình xử lý câu trả lời!",
                threadID, messageID
            );
        }
    }
};
