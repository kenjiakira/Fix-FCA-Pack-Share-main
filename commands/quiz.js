const path = require("path");
const fs = require("fs-extra");
const { updateBalance } = require('../utils/currencies');
const { createQuizCanvas, createQuizResultCanvas, canvasToStream } = require('../game/canvas/quizCanvas');
const { useGPT } = require('../utils/gptHook');

const QUESTIONS_FILE = path.join(__dirname, './json/quiz/questions.json');
const HISTORY_FILE = path.join(__dirname, './json/quiz/history.json');

fs.ensureDirSync(path.dirname(QUESTIONS_FILE));
fs.ensureDirSync(path.dirname(HISTORY_FILE));

const quizSessions = new Map();
const REWARD_AMOUNT = 1000;

let questionHistory = {};
try {
    questionHistory = fs.readJsonSync(HISTORY_FILE, { throws: false }) || {};
} catch (error) {
    fs.writeJsonSync(HISTORY_FILE, {});
}

let questionsDB = [];
try {
    questionsDB = fs.readJsonSync(QUESTIONS_FILE, { throws: false }) || [];
} catch (error) {
    fs.writeJsonSync(QUESTIONS_FILE, []);
}

const saveQuestion = async (question) => {
    if (!question.difficulty) {
        question.difficulty = Math.floor(Math.random() * 3) + 1; // 1-3
    }
    
    // Kiểm tra trùng nội dung
    const isDuplicate = questionsDB.some(q => 
        q.question.toLowerCase().replace(/\s+/g, '') === 
        question.question.toLowerCase().replace(/\s+/g, '')
    );
    
    if (!isDuplicate) {
        questionsDB.push(question);
        
        // Ghi ra console để debug
        console.log(`Lưu câu hỏi mới: ${question.id}`);
        console.log(`Tổng số câu hỏi hiện tại: ${questionsDB.length}`);
        
        // Ghi ra file
        try {
            await fs.writeJsonSync(QUESTIONS_FILE, questionsDB);
            return true;
        } catch (error) {
            console.error("Lỗi khi lưu câu hỏi:", error);
            return false;
        }
    }
    return false;
};

const updateHistory = async (threadID, questionId) => {
    if (!questionHistory[threadID]) {
        questionHistory[threadID] = [];
    }
    questionHistory[threadID].push(questionId);
    await fs.writeJson(HISTORY_FILE, questionHistory);
};

const getRandomQuestion = (threadID) => {
    const threadHistory = questionHistory[threadID] || [];
    let availableQuestions = questionsDB;
    
    if (threadHistory.length >= questionsDB.length) {
        questionHistory[threadID] = [];
        return questionsDB[Math.floor(Math.random() * questionsDB.length)];
    }
    
    availableQuestions = questionsDB.filter(q => !threadHistory.includes(q.id));
    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
};

const getRandomCategory = () => {
    const categories = [
        "khoa_hoc", "lich_su", "dia_ly", "van_hoa",
        "nghe_thuat", "the_thao", "cong_nghe", "toan_hoc"
    ];
    return categories[Math.floor(Math.random() * categories.length)];
};
const CATEGORY_NAMES = {
    'khoa_hoc': 'Khoa học',
    'lich_su': 'Lịch sử',
    'dia_ly': 'Địa lý',
    'van_hoa': 'Văn hóa',
    'nghe_thuat': 'Nghệ thuật',
    'the_thao': 'Thể thao',
    'cong_nghe': 'Công nghệ',
    'toan_hoc': 'Toán học',
    'default': 'Kiến thức chung'
};
const shuffleAnswers = (question) => {
 
    const options = [
        { key: 'A', text: question.options.A, isCorrect: question.correct === 'A' },
        { key: 'B', text: question.options.B, isCorrect: question.correct === 'B' },
        { key: 'C', text: question.options.C, isCorrect: question.correct === 'C' },
        { key: 'D', text: question.options.D, isCorrect: question.correct === 'D' }
    ];
    
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    const newOptions = {
        A: options[0].text,
        B: options[1].text,
        C: options[2].text,
        D: options[3].text
    };
    
    let correctAnswer = 'A';
    if (options[1].isCorrect) correctAnswer = 'B';
    else if (options[2].isCorrect) correctAnswer = 'C';
    else if (options[3].isCorrect) correctAnswer = 'D';
    
    const shuffledQuestion = {
        ...question,
        options: newOptions,
        correct: correctAnswer
    };
    
    return shuffledQuestion;
};

const generateQuiz = async () => {
    const category = getRandomCategory();

    const prompt = `Tạo câu hỏi trắc nghiệm tiếng Việt:

    Chủ đề: ${category}
    
    QUY TẮC QUAN TRỌNG:
    1. TUYỆT ĐỐI KHÔNG được dùng các từ:
       - "Ai là..."
       - "Cái nào là..."
       - "Đâu là..."
       - "... là gì?"
       
    2. Phải dùng một trong các dạng câu sau:
       - "Tại sao [hiện tượng] lại [kết quả]?"
       - "Điều gì sẽ xảy ra nếu [điều kiện]?"
       - "Làm thế nào [nguyên nhân] dẫn đến [kết quả]?"
       - "So sánh sự khác biệt giữa [A] và [B] trong [bối cảnh]"
       - "Giải thích cơ chế/quy trình của [hiện tượng]"
    
    3. Đáp án phải:
       - KHÔNG được chỉ là tên người/địa điểm/sự vật đơn giản
       - Phải là câu giải thích/phân tích ngắn gọn (KHÔNG QUÁ 25 TỪ mỗi đáp án)
       - Có độ dài tương đương nhau
       - NGHIÊM CẤM viết đáp án dài hơn 25 từ
       
    4. Nội dung:
       - Phải ngắn gọn, súc tích, dễ hiểu
       - Mới lạ, không trùng lặp
       - Kích thích tư duy phân tích
       - Liên hệ thực tế

    Định dạng trả về:
    Q: [câu hỏi theo quy tắc trên, tối đa 30 từ]
    A: [giải thích ngắn gọn 1, tối đa 25 từ]
    B: [giải thích ngắn gọn 2, tối đa 25 từ]
    C: [giải thích ngắn gọn 3, tối đa 25 từ]
    D: [giải thích ngắn gọn 4, tối đa 25 từ]
    Correct: [chữ cái đáp án đúng]`;

    try {
        const response = await useGPT({
            prompt,
            type: "educational",
            context: `Tạo câu hỏi trắc nghiệm chủ đề: ${category}`
        });

        const lines = response.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 6) {
            console.error(`Định dạng đầu ra không đúng: ${response}`);
            return null;
        }
        
        let question = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            category: category,
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
            ["A", "B", "C", "D"].includes(question.correct) &&
            !question.question.toLowerCase().startsWith('ai là') &&
            !question.question.toLowerCase().startsWith('đâu là') &&
            !question.question.toLowerCase().includes(' là gì');

        if (isValid) {
            question = shuffleAnswers(question);
            const saved = await saveQuestion(question);
            if (saved) {
                console.log("Đã lưu câu hỏi mới thành công");
                return question;
            }
        } else {
            console.error("Câu hỏi không hợp lệ:", question);
        }
    } catch (error) {
        console.error("Lỗi khi tạo câu hỏi:", error);
        throw error;
    }

    return null;
};

module.exports = {
    name: "quiz",
    dev: "HNT",
    usedby: 0,
    hide: true,
    category: "Games",
    info: "Trả lời câu hỏi trắc nghiệm",
    usages: "quiz",
    onPrefix: true,
    cooldowns: 120,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;
    
        try {
            console.log(`Số câu hỏi hiện có: ${questionsDB.length}`);
            console.log(`Thread history: ${JSON.stringify(questionHistory[threadID] || [])}`);
    
            if (quizSessions.has(threadID)) {
                const existingSession = quizSessions.get(threadID);
                const elapsedTime = Date.now() - existingSession.timestamp;
                
                if (elapsedTime > 600000) {
                    console.log(`Cleaning up stale quiz session in thread ${threadID}`);
                    quizSessions.delete(threadID);
                } else {
                    return api.sendMessage("⚠️ Đã có câu hỏi đang chờ trả lời trong nhóm này!", threadID, messageID);
                }
            }
    
            let quiz;
            if (questionsDB.length > 1000) {
                quiz = getRandomQuestion(threadID);
                quiz = shuffleAnswers(quiz);
                await updateHistory(threadID, quiz.id);
                console.log(`Lấy câu hỏi có sẵn: ${quiz.id}`);
            } else {
                console.log("Không đủ câu hỏi, tạo mới...");
                quiz = await generateQuiz();
                await updateHistory(threadID, quiz.id);
                console.log(`Đã tạo câu hỏi mới: ${quiz.id}`);
            }
            
            const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            
            quizSessions.set(threadID, {
                ...quiz,
                timestamp: Date.now(),
                answered: false,
                sessionId: sessionId
            });
            
            console.log(`Starting new quiz session ${sessionId} in thread ${threadID}`);
    
            try {
                const quizCanvas = await createQuizCanvas(quiz, 120);
                const quizAttachment = await canvasToStream(quizCanvas, 'quiz_question');
                
                const sent = await api.sendMessage({
                    body: `📝 CÂU HỎI TRẮC NGHIỆM | ${CATEGORY_NAMES[quiz.category] || 'Kiến thức chung'}`,
                    attachment: quizAttachment
                }, threadID);
                
                const timerIds = [];
                
                const timerIntervals = [60, 30, 10]; 
                timerIntervals.forEach(seconds => {
                    const timerId = setTimeout(async () => {
                        const currentSession = quizSessions.get(threadID);
                        if (currentSession && 
                            currentSession.sessionId === sessionId && 
                            !currentSession.answered) {
                            try {
                                const updatedCanvas = await createQuizCanvas(quiz, seconds);
                                const updatedAttachment = await canvasToStream(updatedCanvas, `quiz_timer_${seconds}`);
                                await api.sendMessage({
                                    body: `⏱️ Còn ${seconds} giây để trả lời!`,
                                    attachment: updatedAttachment
                                }, threadID);
                            } catch (err) {
                                console.error("Error updating quiz timer:", err);
                            }
                        }
                    }, (120 - seconds) * 1000);
                    timerIds.push(timerId);
                });
        
                const finalTimerId = setTimeout(async () => {
                    const currentSession = quizSessions.get(threadID);
                    if (currentSession && 
                        currentSession.sessionId === sessionId && 
                        !currentSession.answered) {
                        console.log(`Quiz session ${sessionId} timed out in thread ${threadID}`);
                        
                        try {
                            const resultCanvas = await createQuizResultCanvas(currentSession, null, false);
                            const resultAttachment = await canvasToStream(resultCanvas, 'quiz_timeout');
                            await api.sendMessage({
                                body: `⏱️ Hết thời gian!`,
                                attachment: resultAttachment
                            }, threadID);
                        } catch (err) {
                            console.error("Error creating timeout result canvas:", err);
                            api.sendMessage(`⏱️ Hết thời gian!\nĐáp án đúng là: ${currentSession.correct}`, threadID);
                        }
                        
                        if (quizSessions.get(threadID)?.sessionId === sessionId) {
                            quizSessions.delete(threadID);
                        }
                    }
                }, 120000);
                timerIds.push(finalTimerId);
                
                quizSessions.get(threadID).timerIds = timerIds;
    
                global.client.onReply.push({
                    name: this.name,
                    messageID: sent.messageID,
                    author: senderID,
                    sessionId: sessionId, 
                });
    
            } catch (canvasError) {
                console.error("Canvas error:", canvasError);
                
                const message = `📝 CÂU HỎI TRẮC NGHIỆM\n\n${quiz.question}\n\n` +
                              `A. ${quiz.options.A}\n` +
                              `B. ${quiz.options.B}\n` +
                              `C. ${quiz.options.C}\n` +
                              `D. ${quiz.options.D}\n\n` +
                              `💡 Trả lời bằng cách reply tin nhắn với A, B, C hoặc D\n` +
                              `💰 Phần thưởng: ${REWARD_AMOUNT}$\n` +
                              `⏰ Thời gian: 2 phút`;
                              
                const sent = await api.sendMessage(message, threadID);
                
                const finalTimerId = setTimeout(() => {
                    const currentSession = quizSessions.get(threadID);
                    if (currentSession && 
                        currentSession.sessionId === sessionId && 
                        !currentSession.answered) {
                        api.sendMessage(`⏱️ Hết thời gian!\nĐáp án đúng là: ${currentSession.correct}`, threadID);
                        
                        if (quizSessions.get(threadID)?.sessionId === sessionId) {
                            quizSessions.delete(threadID);
                        }
                    }
                }, 120000);
                
                quizSessions.get(threadID).timerIds = [finalTimerId];
                
                global.client.onReply.push({
                    name: this.name,
                    messageID: sent.messageID,
                    author: senderID,
                    sessionId: sessionId,
                });
            }
        } catch (error) {
            console.error("Quiz error:", error);
            api.sendMessage("❌ Có lỗi xảy ra, vui lòng thử lại sau!", threadID, messageID);
        }
    },
    onReply: async function({ api, event }) {
        const { threadID, messageID, body } = event;
        const session = quizSessions.get(threadID);
    
        if (!session || session.answered) return;
    
        const answer = body.trim().toUpperCase();
        if (!["A", "B", "C", "D"].includes(answer)) {
            return api.sendMessage("⚠️ Vui lòng chỉ trả lời A, B, C hoặc D!", threadID, messageID);
        }
    
        quizSessions.get(threadID).answered = true;
        const isCorrect = answer === session.correct;
    
        try {
            if (isCorrect) {
                updateBalance(event.senderID, REWARD_AMOUNT);
            }
            
            const resultCanvas = await createQuizResultCanvas(session, answer, isCorrect, REWARD_AMOUNT);
            const resultAttachment = await canvasToStream(resultCanvas, 'quiz_result');
            
            await api.sendMessage({
                body: isCorrect ? 
                    `🎉 Chúc mừng! Bạn đã trả lời đúng và nhận được ${REWARD_AMOUNT}$` : 
                    `❌ Tiếc quá! Đáp án đúng là: ${session.correct}`,
                attachment: resultAttachment
            }, threadID, messageID);
            
        } catch (canvasError) {
            console.error("Canvas error in reply:", canvasError);
            
            if (isCorrect) {
                updateBalance(event.senderID, REWARD_AMOUNT);
                api.sendMessage(
                    `🎉 Chúc mừng! Bạn đã trả lời đúng!\n` +
                    `💰 Nhận thưởng ${REWARD_AMOUNT}$\n` +
                    `✨ Đáp án: ${session.correct}`,
                    threadID, messageID
                );
            } else {
                api.sendMessage(
                    `❌ Tiếc quá, đáp án sai rồi!\n` +
                    `✨ Đáp án đúng là: ${session.correct}`,
                    threadID, messageID
                );
            }
        }
    
        quizSessions.delete(threadID);
    }
};