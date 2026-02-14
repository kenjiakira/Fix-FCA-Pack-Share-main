const path = require("path");
const fs = require("fs-extra");
const { updateBalance } = require('../utils/currencies');
const { applyWorkTax, addToTaxFund } = require('../utils/tax');
const { useGPT } = require('../utils/gptHook');
const {
    createAltpCanvas,
    createAltpResultCanvas,
    createAudienceHelpCanvas,
    createPhoneAFriendCanvas,
    createFiftyFiftyCanvas,
    canvasToStream
} = require('../game/canvas/altpCanvas.js');

const MESSAGE_LIFETIME = 15000;
const ANSWER_COOLDOWN = 10000;
const QUESTION_TIME_LIMIT = 120000;
const COOLDOWN_AFTER_GAME_MS = 30 * 60 * 1000;

const API_KEYS = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/json/chatbot/key.json'))).api_keys;
const QUESTIONS_FILE = path.join(__dirname, '../database/json/quiz/questions.json');
const usedQuestions = new Set();
const gameStates = new Map();
const lastAnswerTime = new Map();
const lastAltpGameEnd = new Map();
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

function payAltpWinnings(userId, grossAmount) {
    if (grossAmount <= 0) return { net: 0, tax: 0 };
    const { netPay, taxAmount } = applyWorkTax(grossAmount, userId);
    if (taxAmount > 0) addToTaxFund(taxAmount);
    updateBalance(userId, netPay);
    return { net: netPay, tax: taxAmount };
}

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
function getHelpMessage(helpType, question) {
    if (helpType === "5050") {
        const newOptions = fiftyFifty(question.correct, question.options);
        return `✂️ 50:50 | Các đáp án còn lại:\n` +
            Object.entries(newOptions)
                .filter(([_, text]) => text !== "---")
                .map(([key, text]) => `${key}. ${text}`)
                .join("\n");
    } else if (helpType === "AUDIENCE") {
        const results = simulateAudienceHelp(question.correct);
        return `👥 Ý kiến khán giả:\n` +
            `A: ${results.A}%\n` +
            `B: ${results.B}%\n` +
            `C: ${results.C}%\n` +
            `D: ${results.D}%`;
    } else if (helpType === "CALL") {
        const response = phoneAFriend(question.correct);
        return `📞 Gọi điện thoại:\n${response}`;
    }
    return "❌ Loại trợ giúp không hợp lệ!";
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
                const { net, tax } = payAltpWinnings(state.player, moneyWon);
                const taxText = tax > 0 ? ` (sau thuế: ${net.toLocaleString()}$)` : '';
                api.sendMessage(`Game over! Bạn đã dừng cuộc chơi với ${moneyWon.toLocaleString()}$${taxText}`, threadID);
                lastAltpGameEnd.set(threadID, Date.now());
                gameStates.delete(threadID);
            }
            return;
        }

        if (gameStates.has(threadID)) {
            return api.sendMessage("⚠️ Đã có người đang chơi trong nhóm này!", threadID);
        }

        const lastEnd = lastAltpGameEnd.get(threadID);
        if (lastEnd && Date.now() - lastEnd < COOLDOWN_AFTER_GAME_MS) {
            const waitSec = Math.ceil((COOLDOWN_AFTER_GAME_MS - (Date.now() - lastEnd)) / 1000);
            return api.sendMessage(
                `⏳ Nhóm vừa kết thúc một lượt chơi. Vui lòng đợi ${Math.ceil(waitSec / 60)} phút ${waitSec % 60 > 0 ? waitSec % 60 + ' giây' : ''} nữa mới chơi lại.`,
                threadID,
                messageID
            );
        }
        if (!global.altpTimeoutChecker) {
            global.altpTimeoutChecker = setInterval(() => {
                const now = Date.now();

                gameStates.forEach((state, tid) => {
                    if (state.questionTime && now - state.questionTime > QUESTION_TIME_LIMIT) {

                        const moneyWon = state.level > 0 ? MONEY_LADDER[state.level - 1] : 0;
                        const { net, tax } = payAltpWinnings(state.player, moneyWon);
                        const taxText = tax > 0 ? ` (sau thuế: ${net.toLocaleString()}$)` : '';

                        api.sendMessage(
                            `⏰ Hết thời gian! Người chơi không trả lời trong 2 phút.\n` +
                            `💰 Kết thúc trò chơi với ${moneyWon.toLocaleString()}$${taxText}`,
                            tid
                        );

                        lastAltpGameEnd.set(tid, now);
                        gameStates.delete(tid);
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
        let sent;

        try {
            const welcomeCanvas = await createAltpCanvas({
                type: 'welcome',
                gameState: {
                    level: 0,
                    lifelines: { ...LIFELINES }
                }
            });

            const welcomeAttachment = await canvasToStream(welcomeCanvas, 'altp_welcome');

            sent = await api.sendMessage({
                body: "🎮 AI LÀ TRIỆU PHÚ | Reply READY để bắt đầu!",
                attachment: welcomeAttachment
            }, threadID);
        } catch (err) {
            console.error("Canvas error:", err);
            sent = await api.sendMessage(welcome, threadID);
        }

        if (!sent) {
            throw new Error("Failed to send welcome message");
        }

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
                gameState.questionTime = Date.now(); 

                try {
                    const questionCanvas = await createAltpCanvas({
                        type: 'question',
                        gameState: gameState,
                        question: question,
                        timeLeft: 120 
                    });

                    const questionAttachment = await canvasToStream(questionCanvas, 'altp_question');

                    const questionMessage = await api.sendMessage({
                        body: `❓ CÂU HỎI SỐ ${gameState.level + 1}`,
                        attachment: questionAttachment
                    }, threadID);

                    gameState.lastMessage = questionMessage.messageID;

                    global.client.onReply.push({
                        name: this.name,
                        messageID: questionMessage.messageID,
                        author: senderID,
                        gameData: gameState
                    });

                } catch (err) {
                    console.error("Canvas error:", err);
                    const fallbackMessage = await api.sendMessage(
                        this.formatQuestion(question, gameState),
                        threadID
                    );
                    gameState.lastMessage = fallbackMessage.messageID;

                    global.client.onReply.push({
                        name: this.name,
                        messageID: fallbackMessage.messageID,
                        author: senderID,
                        gameData: gameState
                    });
                }

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
                try {
                    let helpCanvas;
                    if (helpType === "5050") {
                        const newOptions = fiftyFifty(gameState.currentQuestion.correct, gameState.currentQuestion.options);
                        gameState.currentQuestion.options = newOptions;
                        helpCanvas = await createFiftyFiftyCanvas(gameState.currentQuestion);
                    } else if (helpType === "AUDIENCE") {
                        const results = simulateAudienceHelp(gameState.currentQuestion.correct);
                        helpCanvas = await createAudienceHelpCanvas(results);
                    } else if (helpType === "CALL") {
                        const response = phoneAFriend(gameState.currentQuestion.correct);
                        helpCanvas = await createPhoneAFriendCanvas(response);
                    }

                    const helpAttachment = await canvasToStream(helpCanvas, `altp_help_${helpType.toLowerCase()}`);
                    const sent = await api.sendMessage({
                        body: `🛟 Sử dụng trợ giúp ${LIFELINES[helpType]}`,
                        attachment: helpAttachment
                    }, threadID);

                    delete gameState.lifelines[helpType];

                    setTimeout(() => api.unsendMessage(sent.messageID), MESSAGE_LIFETIME * 2);

                } catch (err) {
                    console.error("Lỗi khi tạo canvas trợ giúp:", err);

                    const helpMsg = getHelpMessage(helpType, gameState.currentQuestion);
                    const sent = await api.sendMessage(helpMsg, threadID);
                    setTimeout(() => api.unsendMessage(sent.messageID), MESSAGE_LIFETIME * 2);

                    delete gameState.lifelines[helpType];
                }
                return;
            } else {
                const msg = await api.sendMessage("⚠️ Bạn đã sử dụng quyền trợ giúp này!", threadID);
                setTimeout(() => api.unsendMessage(msg.messageID), MESSAGE_LIFETIME);
                return;
            }
        }

        if (["A", "B", "C", "D"].includes(answer)) {
            if (gameState.questionTime && Date.now() - gameState.questionTime > QUESTION_TIME_LIMIT) {
                const moneyWon = gameState.level > 0 ? MONEY_LADDER[gameState.level - 1] : 0;
                const { net, tax } = payAltpWinnings(senderID, moneyWon);
                const taxText = tax > 0 ? ` (sau thuế: ${net.toLocaleString()}$)` : '';
                const timeoutMsg = await api.sendMessage(
                    `⏰ Hết thời gian! Bạn đã trả lời quá 2 phút cho phép.\n` +
                    `💰 Bạn ra về với ${moneyWon.toLocaleString()}$${taxText}`,
                    threadID
                );
                setTimeout(() => api.unsendMessage(timeoutMsg.messageID), MESSAGE_LIFETIME * 2);

                lastAltpGameEnd.set(threadID, Date.now());
                gameStates.delete(threadID);
                return;
            }
            if (answer === gameState.currentQuestion.correct) {
                gameState.level++;

                if (gameState.level === MONEY_LADDER.length) {
                    const jackpot = MONEY_LADDER[gameState.level - 1];
                    const { net, tax } = payAltpWinnings(senderID, jackpot);
                    const taxLine = tax > 0 ? `\n📋 Thuế: -${tax.toLocaleString()}$ → Nhận: ${net.toLocaleString()}$` : '';
                    await api.sendMessage(
                        `🎉 CHÚC MỪNG! BẠN ĐÃ TRỞ THÀNH TRIỆU PHÚ!\n` +
                        `💰 Phần thưởng: ${jackpot.toLocaleString()}$${taxLine}\n` +
                        `🏆 Bạn đã chinh phục thành công tất cả ${MONEY_LADDER.length - 1} câu hỏi!`,
                        threadID
                    );

                    lastAltpGameEnd.set(threadID, Date.now());
                    gameStates.delete(threadID);
                    return;
                }

                try {
                    if (gameState.lastMessage) {
                        api.unsendMessage(gameState.lastMessage);
                    }
            
                    const currentQuestion = { ...gameState.currentQuestion };
                    
                    const nextQuestion = await this.getQuestion(gameState.level);
                    gameState.questionTime = Date.now();
            
                    try {
                        const resultCanvas = await createAltpResultCanvas({
                            isCorrect: true,
                            question: currentQuestion,  
                            answer: answer,
                            level: gameState.level - 1, 
                            prizeMoney: MONEY_LADDER[gameState.level - 1],
                            isMilestone: [5, 10, 15].includes(gameState.level - 1)
                        });
                        const resultAttachment = await canvasToStream(resultCanvas, 'altp_result');
            
                        const correctMessage = await api.sendMessage({
                            body: "✅ CHÍNH XÁC!",
                            attachment: resultAttachment
                        }, threadID);
            
                        const resultDisplayTime = 8000; 
                        setTimeout(() => api.unsendMessage(correctMessage.messageID), resultDisplayTime);
            
                        gameState.currentQuestion = nextQuestion;
            
                        setTimeout(async () => {
                            try {
                                const questionCanvas = await createAltpCanvas({
                                    type: 'question',
                                    gameState: gameState,
                                    question: nextQuestion, 
                                    timeLeft: 120
                                });

                                const questionAttachment = await canvasToStream(questionCanvas, 'altp_question');

                                const newQuestionMessage = await api.sendMessage({
                                    body: `❓ CÂU HỎI SỐ ${gameState.level + 1}`,
                                    attachment: questionAttachment
                                }, threadID);

                                gameState.lastMessage = newQuestionMessage.messageID;

                                global.client.onReply.push({
                                    name: this.name,
                                    messageID: newQuestionMessage.messageID,
                                    author: senderID,
                                    gameData: gameState
                                });
                            } catch (err) {
                                console.error("Canvas error for next question:", err);
                      
                                const questionMsg = this.formatQuestion(nextQuestion, gameState);
                                const newTextMessage = await api.sendMessage(questionMsg, threadID);

                                gameState.lastMessage = newTextMessage.messageID;

                                global.client.onReply.push({
                                    name: this.name,
                                    messageID: newTextMessage.messageID,
                                    author: senderID,
                                    gameData: gameState
                                });
                            }
                        }, 6000); 

                    } catch (err) {
                        console.error("Canvas error for next question:", err);
                        const questionMsg = this.formatQuestion(nextQuestion, gameState);
                        const newTextMessage = await api.sendMessage(questionMsg, threadID);

                        setTimeout(async () => {
                            try {
                                gameState.lastMessage = newTextMessage.messageID;

                                global.client.onReply.push({
                                    name: this.name,
                                    messageID: newTextMessage.messageID,
                                    author: senderID,
                                    gameData: gameState
                                });
                            } catch (err) {
                                console.error("Error in setTimeout callback:", err);
                            }
                        }, 6000);
                    }
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
            const category = getRandomCategory();

            const prompt = `Tạo câu hỏi trắc nghiệm tiếng Việt cho game Ai Là Triệu Phú.

            Chủ đề: ${category}
            Độ khó: ${difficulty}/3 (${difficulty === 1 ? 'dễ - câu 1-5' : difficulty === 2 ? 'trung bình - câu 6-10' : 'SIÊU KHÓ - câu 11 trở lên'})
            
            QUY TẮC BẮT BUỘC:
            1. KHÔNG dùng: "Ai là...", "Cái nào là...", "Đâu là...", "... là gì?"
            2. BỐN ĐÁP ÁN A, B, C, D PHẢI KHÁC NHAU HOÀN TOÀN:
               - Mỗi đáp án là một ý tưởng/khái niệm/con số RÕ RÀNG, CỤ THỂ
               - CẤM đáp án gần giống nhau, chỉ khác 1-2 từ
               - CẤM đáp án dạng "X", "Y", "Z" chung chung - phải viết rõ nội dung
               - Ví dụ SAI: A: Năm 1945 | B: Năm 1946 | C: Năm 1947 (quá giống)
               - Ví dụ ĐÚNG: A: Chiến tranh thế giới 2 | B: Cách mạng công nghiệp | C: Phát minh điện | D: Thành lập Liên Hợp Quốc
            
            3. Độ khó theo level:
               ${difficulty === 1 ? `LEVEL 1 (DỄ - câu 1-5):
               - Kiến thức cơ bản, ai cũng biết
               - Câu hỏi trực tiếp, đáp án rõ ràng phân biệt` :
                    difficulty === 2 ? `LEVEL 2 (TRUNG BÌNH - câu 6-10):
               - Kiến thức chuyên sâu hơn
               - Cần suy luận, loại trừ đáp án sai` :
                        `LEVEL 3 (SIÊU KHÓ - câu 11+):
               - Kiến thức HỌC THUẬT, CHUYÊN NGÀNH, ÍT NGƯỜI BIẾT
               - Chi tiết cụ thể: tên riêng, năm chính xác, thuật ngữ chuyên môn
               - Đòi hỏi tư duy phản biện, liên kết ĐA LĨNH VỰC
               - Các đáp án sai phải "có vẻ đúng" để gây nhiễu, nhưng vẫn PHÂN BIỆT RÕ
               - Câu hỏi kiểu: cơ chế sâu, so sánh tinh tế, ngoại lệ, chi tiết ít biết`}

            ĐỊNH DẠNG ĐẦU RA (bắt buộc):
            Q: [câu hỏi, tối đa 35 từ]
            A: [đáp án CỤ THỂ, tối đa 25 từ]
            B: [đáp án CỤ THỂ, tối đa 25 từ]
            C: [đáp án CỤ THỂ, tối đa 25 từ]
            D: [đáp án CỤ THỂ, tối đa 25 từ]
            Correct: [A hoặc B hoặc C hoặc D]`;

            const response = await useGPT({
                prompt,
                type: "educational",
                context: `AI là triệu phú - level ${level}, độ khó ${difficulty}, chủ đề ${category}`
            });

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
            
        } catch (apiError) {
            console.error(`⚠️ Không thể dùng AI, chuyển sang dùng câu hỏi dự phong... Lỗi:`, apiError);
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