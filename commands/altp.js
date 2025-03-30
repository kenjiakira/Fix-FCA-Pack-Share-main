const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs-extra");
const { updateBalance } = require('../utils/currencies');

const MESSAGE_LIFETIME = 5000; // For status messages
const QUESTION_LIFETIME = 60000; // Keep questions visible for 1 minute
const ANSWER_COOLDOWN = 10000;
const QUESTION_TIME_LIMIT = 120000;

const API_KEYS = JSON.parse(fs.readFileSync(path.join(__dirname, "./json/chatbot/key.json"))).api_keys;
const QUESTIONS_FILE = path.join(__dirname, './json/quiz/questions.json');
const usedQuestions = new Set();
const gameStates = new Map();
const lastAnswerTime = new Map();
const MONEY_LADDER = [

    0, 200, 400, 600, 1000, 2000,
    4000, 8000, 16000, 32000, 64000,
    125000, 250000, 500000, 1000000
];

const LIFELINES = {
    "5050": "50:50",
    "AUDIENCE": "Hỏi ý kiến khán giả",
    "CALL": "Gọi điện thoại cho người thân"
};

function simulateAudienceHelp(correctAnswer) {
    const results = { A: 0, B: 0, C: 0, D: 0 };

    results[correctAnswer] = 45 + Math.floor(Math.random() * 30);

    let remaining = 100 - results[correctAnswer];
    for (let option of ['A', 'B', 'C', 'D']) {
        if (option !== correctAnswer) {
            const rand = Math.floor(Math.random() * remaining);
            results[option] = rand;
            remaining -= rand;
        }
    }
    return results;
}

function fiftyFifty(correctAnswer, options) {
    const wrongAnswers = Object.keys(options).filter(key => key !== correctAnswer);
    const keepWrong = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];

    const newOptions = {};
    for (let key in options) {
        if (key === correctAnswer || key === keepWrong) {
            newOptions[key] = options[key];
        } else {
            newOptions[key] = "---";
        }
    }
    return newOptions;
}

function phoneAFriend(correctAnswer) {
    const confidence = Math.random();
    if (confidence > 0.3) {
        return `Tôi khá chắc chắn đáp án là ${correctAnswer}`;
    } else {
        const answers = ['A', 'B', 'C', 'D'].filter(a => a !== correctAnswer);
        const wrong = answers[Math.floor(Math.random() * answers.length)];
        return `Tôi không chắc lắm, nhưng có thể là ${wrong}`;
    }
}

function getRandomCategory() {
    const categories = [
        "Lịch sử", "Địa lý", "Khoa học", "Văn học",
        "Nghệ thuật", "Thể thao", "Công nghệ", "Đời sống",
        "Sinh học", "Vật lý", "Hóa học", "Toán học"
    ];
    return categories[Math.floor(Math.random() * categories.length)];
}

function shuffleAnswers(question) {
    const correctText = question.options[question.correct];

    const optionKeys = ['A', 'B', 'C', 'D'];
    const optionValues = [
        question.options.A,
        question.options.B,
        question.options.C,
        question.options.D
    ];

    for (let i = optionValues.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [optionValues[i], optionValues[j]] = [optionValues[j], optionValues[i]];
    }

    const shuffledOptions = {
        A: optionValues[0],
        B: optionValues[1],
        C: optionValues[2],
        D: optionValues[3]
    };

    let newCorrect = '';
    for (const [key, value] of Object.entries(shuffledOptions)) {
        if (value === correctText) {
            newCorrect = key;
            break;
        }
    }

    const questionIdHash = question.id ?
        question.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) :
        Date.now();

    if (questionIdHash % 4 === 0 && newCorrect === 'A') {

        [shuffledOptions.A, shuffledOptions.C] = [shuffledOptions.C, shuffledOptions.A];
        newCorrect = 'C';
    } else if (questionIdHash % 4 === 1 && newCorrect === 'A') {

        [shuffledOptions.A, shuffledOptions.D] = [shuffledOptions.D, shuffledOptions.A];
        newCorrect = 'D';
    }

    return {
        ...question,
        options: shuffledOptions,
        correct: newCorrect,
        original_correct: question.correct
    };
}

async function saveQuestion(question) {
    try {
        const questions = fs.existsSync(QUESTIONS_FILE)
            ? fs.readJsonSync(QUESTIONS_FILE)
            : [];

        questions.push(question);
        await fs.writeJson(QUESTIONS_FILE, questions, { spaces: 2 });
        return true;
    } catch (error) {
        console.error("Error saving question:", error);
        return false;
    }
}

module.exports = {
    name: "altp",
    dev: "HNT",
    category: "Games",
    hide: true,
    info: "Ai Là Triệu Phú",
    usages: "altp [new/stop]",
    onPrefix: true,
    cooldowns: 60,
    onUnload: function () {
        if (global.altpTimeoutChecker) {
            clearInterval(global.altpTimeoutChecker);
            delete global.altpTimeoutChecker;
        }
    },
    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        if (target[0] === "stop") {
            if (gameStates.has(threadID)) {
                const state = gameStates.get(threadID);
                const moneyWon = state.level > 0 ? MONEY_LADDER[state.level - 1] : 0;
                api.sendMessage(`Game over! Bạn đã dừng cuộc chơi với ${moneyWon}$`, threadID);
                gameStates.delete(threadID);
            }
            return;
        }

        if (gameStates.has(threadID)) {
            return api.sendMessage("⚠️ Đã có người đang chơi trong nhóm này!", threadID);
        }
        if (!global.altpTimeoutChecker) {
            global.altpTimeoutChecker = setInterval(() => {
                const now = Date.now();

                gameStates.forEach((state, threadID) => {
                    if (state.questionTime && now - state.questionTime > QUESTION_TIME_LIMIT) {

                        const moneyWon = state.level > 0 ? MONEY_LADDER[state.level - 1] : 0;

                        api.sendMessage(
                            `⏰ Hết thời gian! Người chơi không trả lời trong 2 phút.\n` +
                            `💰 Kết thúc trò chơi với ${moneyWon}$`,
                            threadID
                        );

                        if (moneyWon > 0 && state.player) {
                            updateBalance(state.player, moneyWon);
                        }

                        gameStates.delete(threadID);
                    }
                });
            }, 5000);
        }
        gameStates.set(threadID, {
            level: 0,
            lifelines: { ...LIFELINES },
            currentQuestion: null,
            player: senderID,
            moneyWon: 0
        });
        const moneyLadderDisplay = MONEY_LADDER.slice(1).map((money, idx) => {
            const level = idx + 1;
            const milestone = [5, 10, 15].includes(level) ? '🔶 ' : '   ';
            return `${milestone}${level}. ${money.toLocaleString()}$`;
        }).join('\n');

        const welcome = `
    ╭「 🎮 AI LÀ TRIỆU PHÚ 🎮 」╮
    
    👤 Người chơi: ${senderID}
    
    💰 MỐC TIỀN THƯỞNG:
    ${moneyLadderDisplay}
    
    🔶 = Mốc đảm bảo tiền thưởng
    
🛟 TRỢ GIÚP:
✂️ 50:50 - Loại bỏ 2 đáp án sai (Reply "5050")
👥 Hỏi ý kiến khán giả (Reply "AUDIENCE")
📞 Gọi điện thoại cho người thân (Reply "CALL")

    ⏱️ LUẬT CHƠI:
    • Mỗi câu hỏi có thời gian trả lời là 2 phút
    • Reply A, B, C, D để chọn đáp án
    • Trả lời đúng để tiến lên câu tiếp theo
    • Trả lời sai để kết thúc cuộc chơi
    
    ↪️ Reply "READY" để bắt đầu!
    ╰────────────────╯`;

        const sent = await api.sendMessage(welcome, threadID);

        global.client.onReply.push({
            name: this.name,
            messageID: sent.messageID,
            author: senderID,
            gameData: gameStates.get(threadID)
        });
    },

    onReply: async function ({ api, event, Users }) {
        const { threadID, messageID, senderID, body } = event;
        const gameState = gameStates.get(threadID);

        if (!gameState || gameState.player !== senderID) return;

        const now = Date.now();
        const lastTime = lastAnswerTime.get(senderID) || 0;
        if (now - lastTime < ANSWER_COOLDOWN) {
            const remainingTime = Math.ceil((ANSWER_COOLDOWN - (now - lastTime)) / 1000);
            const msg = await api.sendMessage(
                `⏳ Vui lòng đợi ${remainingTime}s trước khi trả lời tiếp!`,
                threadID
            );
            setTimeout(() => api.unsendMessage(msg.messageID), MESSAGE_LIFETIME);
            return;
        }

        const answer = body.trim().toUpperCase();
        lastAnswerTime.set(senderID, now);

        if (answer === "READY" && gameState.level === 0) {
            try {
                const question = await this.getQuestion(gameState.level);
                gameState.currentQuestion = question;

                const questionMsg = this.formatQuestion(question, gameState);
                const sent = await api.sendMessage(questionMsg, threadID);

                gameState.lastMessage = sent.messageID;
                gameState.questionTime = Date.now();

                global.client.onReply.push({
                    name: this.name,
                    messageID: sent.messageID,
                    author: senderID,
                    gameData: gameState
                });
                return;
            } catch (err) {
                const errorMsg = await api.sendMessage(
                    "❌ Lỗi khi lấy câu hỏi, vui lòng thử lại!",
                    threadID
                );
                setTimeout(() => api.unsendMessage(errorMsg.messageID), MESSAGE_LIFETIME);
                gameStates.delete(threadID);
                return;
            }
        }

        if (answer.startsWith("HELP") || ["5050", "AUDIENCE", "CALL"].includes(answer)) {
            const helpType = answer.startsWith("HELP") ? answer.split(" ")[1] : answer;

            if (gameState.lifelines[helpType]) {
                let helpMsg = "";
                if (helpType === "5050") {
                    const newOptions = fiftyFifty(gameState.currentQuestion.correct, gameState.currentQuestion.options);
                    gameState.currentQuestion.options = newOptions;
                    helpMsg = this.formatQuestion(gameState.currentQuestion, gameState);
                } else if (helpType === "AUDIENCE") {
                    const results = simulateAudienceHelp(gameState.currentQuestion.correct);
                    helpMsg = `📊 Kết quả khảo sát:\nA: ${results.A}%\nB: ${results.B}%\nC: ${results.C}%\nD: ${results.D}%`;
                } else if (helpType === "CALL") {
                    helpMsg = `📞 Người thân trả lời: ${phoneAFriend(gameState.currentQuestion.correct)}`;
                }
                delete gameState.lifelines[helpType];
                const sent = await api.sendMessage(helpMsg, threadID);
                setTimeout(() => api.unsendMessage(sent.messageID), MESSAGE_LIFETIME * 2);
                return;
            }
        }

        if (["A", "B", "C", "D"].includes(answer)) {
            if (gameState.questionTime && Date.now() - gameState.questionTime > QUESTION_TIME_LIMIT) {
                const moneyWon = gameState.level > 0 ? MONEY_LADDER[gameState.level - 1] : 0;
                const timeoutMsg = await api.sendMessage(
                    `⏰ Hết thời gian! Bạn đã trả lời quá 2 phút cho phép.\n` +
                    `💰 Bạn ra về với ${moneyWon}$`,
                    threadID
                );
                setTimeout(() => api.unsendMessage(timeoutMsg.messageID), MESSAGE_LIFETIME * 2);

                if (moneyWon > 0) {
                    updateBalance(senderID, moneyWon);
                }
                gameStates.delete(threadID);
                return;
            }
            if (answer === gameState.currentQuestion.correct) {
                gameState.level++;

                if (gameState.level === MONEY_LADDER.length) {
                    const winMsg = await api.sendMessage(
                        `🎉 CHÚC MỪNG! BẠN ĐÃ TRỞ THÀNH TRIỆU PHÚ!\n` +
                        `💰 Phần thưởng: ${MONEY_LADDER[gameState.level - 1]}$\n` +
                        `🏆 Bạn đã chinh phục thành công tất cả ${MONEY_LADDER.length - 1} câu hỏi!`,
                        threadID
                    );

                    updateBalance(senderID, MONEY_LADDER[gameState.level - 1]);
                    gameStates.delete(threadID);
                    return;
                }

                try {
                    if (gameState.lastMessage) {
                        api.unsendMessage(gameState.lastMessage);
                    }

                    const nextQuestion = await this.getQuestion(gameState.level);
                    gameState.currentQuestion = nextQuestion;

                    const prizeMoney = MONEY_LADDER[gameState.level - 1];
                    const congratsMsg = await api.sendMessage(
                        `╭───「 ✅ CHÍNH XÁC! 」───╮\n` +
                        `🎉 Chúc mừng bạn đã đạt mốc ${prizeMoney.toLocaleString()}$!\n` +
                        `${[5, 10, 15].includes(gameState.level) ? '🔶 Đây là mốc đảm bảo tiền thưởng!\n' : ''}` +
                        `🔼 Tiếp tục với câu hỏi tiếp theo...\n` +
                        `╰───────────────────╯`,
                        threadID
                    );
                    setTimeout(() => api.unsendMessage(congratsMsg.messageID), MESSAGE_LIFETIME);

                    const questionMsg = this.formatQuestion(nextQuestion, gameState);
                    const sent = await api.sendMessage(questionMsg, threadID);

                    gameState.lastMessage = sent.messageID;
                    gameState.questionTime = Date.now();

                    global.client.onReply.push({
                        name: this.name,
                        messageID: sent.messageID,
                        author: senderID,
                        gameData: gameState
                    });
                } catch (err) {
                    console.error("Error getting next question:", err);
                    api.sendMessage("❌ Lỗi khi lấy câu hỏi tiếp theo!", threadID);
                    gameStates.delete(threadID);
                }
            } else {
                const moneyWon = gameState.level > 0 ? MONEY_LADDER[gameState.level - 1] : 0;
                const loseMsg = await api.sendMessage(
                    `❌ Rất tiếc! Đáp án đúng là ${gameState.currentQuestion.correct}\n` +
                    `Bạn ra về với ${moneyWon}$`,
                    threadID
                );
                setTimeout(() => api.unsendMessage(loseMsg.messageID), MESSAGE_LIFETIME * 2);

                if (moneyWon > 0) {
                    updateBalance(senderID, moneyWon);
                }
                gameStates.delete(threadID);
            }
        }
    },

    formatQuestion(question, gameState) {
        if (!gameState || typeof gameState.level !== 'number') {
            throw new Error('Invalid game state');
        }

        const currentPrize = MONEY_LADDER[gameState.level] || 0;
        const questionNumber = gameState.level + 1;
        const totalQuestions = MONEY_LADDER.length - 1;

        let moneyLadderDisplay = '';
        const milestoneLevels = [5, 10, 15];
        const currentLevel = gameState.level;

        const displayRange = 2;
        const startIdx = Math.max(0, currentLevel - displayRange);
        const endIdx = Math.min(MONEY_LADDER.length - 1, currentLevel + displayRange);

        for (let i = endIdx; i >= startIdx; i--) {
            const marker = i === currentLevel ? '▶️ ' : '   ';
            const milestone = milestoneLevels.includes(i + 1) ? '🔶 ' : '';
            moneyLadderDisplay += `${marker}${milestone}${i + 1}. ${MONEY_LADDER[i]}$\n`;
        }

        const lifelinesDisplay = Object.entries(gameState.lifelines).map(([code, name]) => {
            let icon = '⚪';
            if (code === "5050") icon = '✂️';
            if (code === "AUDIENCE") icon = '👥';
            if (code === "CALL") icon = '📞';
            return `${icon} ${name} (HELP ${code})`;
        }).join('\n');

        let timeDisplay = '';
        if (gameState.questionTime) {
            const elapsedMs = Date.now() - gameState.questionTime;
            const remainingSecs = Math.max(0, Math.floor((QUESTION_TIME_LIMIT - elapsedMs) / 1000));
            const minutes = Math.floor(remainingSecs / 60);
            const seconds = remainingSecs % 60;

            let timeIcon = '⏱️';
            let timeWarning = '';

            if (remainingSecs < 30) {
                timeIcon = '⏰';
                timeWarning = ' ⚠️ SẮP HẾT THỜI GIAN!';
            } else if (remainingSecs < 60) {
                timeIcon = '⏰';
            }

            timeDisplay = `${timeIcon} Thời gian còn lại: ${minutes}:${seconds.toString().padStart(2, '0')}${timeWarning}`;
        }

        return `📊 TIẾN TRÌNH: ${questionNumber}/${totalQuestions} | 💰 TIỀN THƯỞNG: ${currentPrize}$\n\n` +
            `${moneyLadderDisplay}\n` +
            `❓ CÂU HỎI SỐ ${questionNumber} - ${question.category}\n\n` +
            `${question.question}\n\n` +
            `A ${question.options.A}\n` +
            `B ${question.options.B}\n` +
            `C ${question.options.C}\n` +
            `D ${question.options.D}\n\n` +
            `${timeDisplay ? timeDisplay + '\n\n' : ''}` +
            `🛟 TRỢ GIÚP CÒN LẠI:\n${lifelinesDisplay}`;
    },

    async getQuestion(level) {
        const getDifficulty = (level) => {
            if (level < 5) return 1;
            if (level < 10) return 2;
            return 3;
        };

        const difficulty = getDifficulty(level);

        try {
            const genAI = new GoogleGenerativeAI(API_KEYS[0]);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const category = getRandomCategory();

            const prompt = `Tạo câu hỏi trắc nghiệm tiếng Việt ${difficulty === 3 ? 'khó' : difficulty === 2 ? 'trung bình' : 'dễ'}:

            Chủ đề: ${category}
            Độ khó: ${difficulty}/3
            
            QUY TẮC:
            1. KHÔNG được dùng các từ:
               - "Ai là...", "Cái nào là...", "Đâu là...", "... là gì?"
               
            2. Phải dùng một trong các dạng câu sau:
               - "Tại sao [hiện tượng] lại [kết quả]?"
               - "Điều gì sẽ xảy ra nếu [điều kiện]?"
               - "Làm thế nào [nguyên nhân] dẫn đến [kết quả]?"
               - "So sánh sự khác biệt giữa [A] và [B]"
               - "Giải thích cơ chế/quy trình của [hiện tượng]"
            
            3. Độ phức tạp tăng dần theo level:
               Level ${difficulty}/3:
               ${difficulty === 1 ? '- Kiến thức cơ bản, phổ thông\n- Câu hỏi và đáp án đơn giản, dễ hiểu' :
                    difficulty === 2 ? '- Kiến thức chuyên sâu hơn\n- Cần phân tích, suy luận' :
                        '- Kiến thức nâng cao\n- Đòi hỏi tư duy phản biện, liên kết nhiều lĩnh vực'}

            Định dạng:
            Q: [câu hỏi, tối đa 30 từ]
            A: [giải thích 1, tối đa 25 từ]
            B: [giải thích 2, tối đa 25 từ]
            C: [giải thích 3, tối đa 25 từ]
            D: [giải thích 4, tối đa 25 từ]
            Correct: [chữ cái đáp án đúng]`;

            let attempts = 0;
            while (attempts < 3) {
                try {
                    console.log(`Đang tạo câu hỏi AI lần ${attempts + 1}...`);
                    const result = await model.generateContent(prompt);
                    // Fix: Add await when getting text from response
                    const response = await result.response.text();

                    if (!response) {
                        throw new Error("API trả về phản hồi trống");
                    }

                    const lines = response.split('\n').filter(line => line.trim() !== '');
                    if (lines.length < 6) {
                        throw new Error("Định dạng đầu ra không đúng");
                    }

                    const question = {
                        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                        category: category,
                        difficulty: difficulty,
                        question: lines[0].replace(/^Q:/, '').trim(),
                        options: {
                            A: lines[1].replace(/^A:/, '').trim(),
                            B: lines[2].replace(/^B:/, '').trim(),
                            C: lines[3].replace(/^C:/, '').trim(),
                            D: lines[4].replace(/^D:/, '').trim()
                        },
                        correct: lines[5].replace(/^Correct:/, '').trim()
                    };

                    const isValid =
                        question.question &&
                        question.options.A &&
                        question.options.B &&
                        question.options.C &&
                        question.options.D &&
                        ["A", "B", "C", "D"].includes(question.correct);

                    if (isValid) {
                        console.log("✅ Tạo câu hỏi AI thành công!");
                        saveQuestion(question).catch(err => console.error("Lỗi lưu câu hỏi:", err));
                        return shuffleAnswers(question);
                    }
                } catch (err) {
                    console.error(`Lỗi lần ${attempts + 1}:`, err);
                    attempts++;
                }
            }
            throw new Error(`Không thể tạo câu hỏi AI sau 3 lần thử (độ khó: ${difficulty}, chủ đề: ${category})`);
        } catch (apiError) {
            console.error(`⚠️ Không thể dùng AI, chuyển sang dùng câu hỏi dự phòng... Lỗi:`, apiError);
        }

        try {
            const quizDir = path.dirname(QUESTIONS_FILE);
            if (!fs.existsSync(quizDir)) {
                fs.mkdirSync(quizDir, { recursive: true });
            }

            if (!fs.existsSync(QUESTIONS_FILE)) {
                fs.writeJsonSync(QUESTIONS_FILE, [], { spaces: 2 });
            }

            const questions = await fs.readJson(QUESTIONS_FILE);
            const suitableQuestions = questions.filter(q =>
                q.difficulty === difficulty &&
                !usedQuestions.has(q.id)
            );

            if (suitableQuestions.length > 0) {
                console.log(`✅ Đã tìm thấy ${suitableQuestions.length} câu hỏi dự phòng phù hợp ở độ khó ${difficulty}`);
                const randomIndex = Math.floor(Math.random() * suitableQuestions.length);
                const question = suitableQuestions[randomIndex];
                usedQuestions.add(question.id);

                if (questions.filter(q => q.difficulty === difficulty).length === usedQuestions.size) {
                    usedQuestions.clear();
                }

                return shuffleAnswers(question);
            }

            console.log(`⚠️ Không tìm thấy câu hỏi phù hợp ở độ khó ${difficulty}, tạo câu hỏi mặc định`);
            return shuffleAnswers(generateDefaultQuestion(difficulty));
        } catch (fileError) {
            console.error("Lỗi khi đọc file câu hỏi:", fileError);

            return shuffleAnswers(generateDefaultQuestion(difficulty));
        }
    }
};
