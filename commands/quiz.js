const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs-extra");
const { updateBalance } = require('../utils/currencies');

const API_KEYS = JSON.parse(fs.readFileSync(path.join(__dirname, "./json/chatbot/key.json"))).api_keys;
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

// Cập nhật cơ chế lưu question để sử dụng biến global questionsDB
const saveQuestion = async (question) => {
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

// Thêm hàm sáo trộn đáp án
const shuffleAnswers = (question) => {
    // Tạo mảng các phương án
    const options = [
        { key: 'A', text: question.options.A, isCorrect: question.correct === 'A' },
        { key: 'B', text: question.options.B, isCorrect: question.correct === 'B' },
        { key: 'C', text: question.options.C, isCorrect: question.correct === 'C' },
        { key: 'D', text: question.options.D, isCorrect: question.correct === 'D' }
    ];
    
    // Sáo trộn mảng
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    // Cập nhật question với các phương án đã sáo trộn
    const shuffledQuestion = {
        ...question,
        options: {
            A: options[0].text,
            B: options[1].text,
            C: options[2].text,
            D: options[3].text
        },
        correct: options.find(opt => opt.isCorrect).key
    };
    
    return shuffledQuestion;
};

// Sửa lại hàm sinh câu hỏi
const generateQuiz = async () => {
    const genAI = new GoogleGenerativeAI(API_KEYS[0]);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

    let attempts = 0;
    let question;
    
    // Thử tối đa 3 lần để tạo câu hỏi không trùng
    while (attempts < 3) {
        try {
            const result = await model.generateContent(prompt);
            const response = result.response.text();
            
            if (!response) {
                console.error("API trả về phản hồi trống");
                attempts++;
                continue;
            }
            
            const lines = response.split('\n').filter(line => line.trim() !== '');
            
            // Kiểm tra định dạng đầu ra
            if (lines.length < 6) {
                console.error(`Định dạng đầu ra không đúng: ${response}`);
                attempts++;
                continue;
            }
            
            question = {
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

            // Kiểm tra tính hợp lệ của câu hỏi
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
                // Sáo trộn đáp án trước khi lưu
                question = shuffleAnswers(question);
                const saved = await saveQuestion(question);
                if (saved) {
                    console.log("Đã lưu câu hỏi mới thành công");
                    break;
                }
            } else {
                console.error("Câu hỏi không hợp lệ:", question);
            }
        } catch (error) {
            console.error("Lỗi khi tạo câu hỏi:", error);
        }
        
        attempts++;
    }

    if (attempts >= 3) {
        throw new Error('Không thể tạo câu hỏi mới sau 3 lần thử');
    }

    return question;
};

module.exports = {
    name: "quiz",
    dev: "HNT",
    usedby: 0,
    category: "Games",
    info: "Trả lời câu hỏi trắc nghiệm",
    usages: "quiz",
    onPrefix: true,
    cooldowns: 30,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;

        try {
            // Log trạng thái hiện tại để debug
            console.log(`Số câu hỏi hiện có: ${questionsDB.length}`);
            console.log(`Thread history: ${JSON.stringify(questionHistory[threadID] || [])}`);

            if (quizSessions.has(threadID)) {
                return api.sendMessage("⚠️ Đã có câu hỏi đang chờ trả lời trong nhóm này!", threadID, messageID);
            }

            // Force tạo câu hỏi mới - bỏ comment dòng này nếu muốn luôn tạo câu hỏi mới
            // const quiz = await generateQuiz();
            
            let quiz;
            // Kiểm tra xem có đủ câu hỏi không
            if (questionsDB.length > 100) {
                quiz = getRandomQuestion(threadID);
                // Sáo trộn đáp án mỗi lần lấy câu hỏi cũ
                quiz = shuffleAnswers(quiz);
                await updateHistory(threadID, quiz.id);
                console.log(`Lấy câu hỏi có sẵn: ${quiz.id}`);
            } else {
                // Nếu không đủ câu hỏi, tạo mới
                console.log("Không đủ câu hỏi, tạo mới...");
                quiz = await generateQuiz();
                await updateHistory(threadID, quiz.id);
                console.log(`Đã tạo câu hỏi mới: ${quiz.id}`);
            }
            
            quizSessions.set(threadID, {
                ...quiz,
                timestamp: Date.now(),
                answered: false
            });

            const message = `📝 CÂU HỎI TRẮC NGHIỆM\n\n${quiz.question}\n\n` +
                          `A. ${quiz.options.A}\n` +
                          `B. ${quiz.options.B}\n` +
                          `C. ${quiz.options.C}\n` +
                          `D. ${quiz.options.D}\n\n` +
                          `💡 Trả lời bằng cách reply tin nhắn với A, B, C hoặc D\n` +
                          `💰 Phần thưởng: ${REWARD_AMOUNT}$\n` +
                          `⏰ Thời gian: 30 giây`;

            const sent = await api.sendMessage(message, threadID);

            setTimeout(() => {
                const session = quizSessions.get(threadID);
                if (session && !session.answered) {
                    api.sendMessage(`⏱️ Hết thời gian!\nĐáp án đúng là: ${session.correct}`, threadID);
                    quizSessions.delete(threadID);
                }
            }, 30000);

            global.client.onReply.push({
                name: this.name,
                messageID: sent.messageID,
                author: senderID
            });

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

        if (answer === session.correct) {
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

        quizSessions.delete(threadID);
    }
};
