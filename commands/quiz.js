module.exports = {
    name: "quiz",
    usedby: 0,
    dmUser: false,
    dev: "HNT",
    nickName: ["quiz", "cauhoi", "ch"],
    info: "Chơi trò chơi câu hỏi trắc nghiệm",
    onPrefix: true,
    cooldowns: 5,

    onReply: async function({ event, api }) {
        const { threadID, messageID, body } = event;
        const input = body.toLowerCase().trim();
        
        if (!global.quiz) global.quiz = {};
        if (!global.quiz[threadID]) return;

        const currentQuestion = global.quiz[threadID];
        const validAnswers = ['a', 'b', 'c', 'd'];

        if (!validAnswers.includes(input)) {
            return api.sendMessage("Vui lòng trả lời bằng A, B, C hoặc D", threadID, messageID);
        }

        const userAnswer = input.toUpperCase();
        const isCorrect = userAnswer === currentQuestion.correct;
        const feedback = isCorrect ? "✅ Chính xác!" : `❌ Sai rồi! Đáp án đúng là ${currentQuestion.correct}`;
        
        api.sendMessage(feedback, threadID, messageID);
        delete global.quiz[threadID];
    },

    async translate(text) {
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
            const res = await fetch(url);
            const data = await res.json();
            return data[0][0][0];
        } catch (error) {
            console.error("Lỗi dịch:", error);
            return text; 
        }
    },

    onLaunch: async function ({ event, api }) {
        const { threadID, messageID } = event;

        try {
            const response = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
            const data = await response.json();
            const question = data.results[0];

            const translatedQuestion = await this.translate(question.question);
            
            const translatedAnswers = await Promise.all([
                ...question.incorrect_answers.map(answer => this.translate(answer)),
                this.translate(question.correct_answer)
            ]);

            const answers = translatedAnswers.slice(0, -1); 
            const correctAnswer = translatedAnswers[translatedAnswers.length - 1];
            answers.push(correctAnswer);

            for (let i = answers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [answers[i], answers[j]] = [answers[j], answers[i]];
            }

            const correctIndex = answers.indexOf(correctAnswer);
            const correct = ['A', 'B', 'C', 'D'][correctIndex];

            const quizMessage = `📝 Câu hỏi:\n${translatedQuestion}\n\n` +
                `A. ${answers[0]}\n` +
                `B. ${answers[1]}\n` +
                `C. ${answers[2]}\n` +
                `D. ${answers[3]}\n\n` +
                `Trả lời bằng cách nhập A, B, C hoặc D!`;

            const msg = await api.sendMessage(quizMessage, threadID, messageID);

            global.quiz = global.quiz || {};
            global.quiz[threadID] = {
                correct: correct,
                question: question.question
            };

            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: event.senderID
            });
        } catch (error) {
            api.sendMessage("Xin lỗi, không thể tải hoặc dịch câu hỏi. Vui lòng thử lại sau.", threadID, messageID);
        }
    }
};
