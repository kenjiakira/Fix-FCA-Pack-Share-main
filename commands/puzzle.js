const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs");
const { getBalance, updateBalance } = require('../utils/currencies');

const API_KEYS = JSON.parse(fs.readFileSync(path.join(__dirname, "./json/chatbot/key.json"))).api_keys;
const PUZZLES_FILE = path.join(__dirname, './json/puzzle/puzzles.json');
const HISTORY_FILE = path.join(__dirname, './json/puzzle/history.json');

function ensureDirectoryExists(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
}

ensureDirectoryExists(PUZZLES_FILE);
ensureDirectoryExists(HISTORY_FILE);

if (!fs.existsSync(PUZZLES_FILE)) {
    fs.writeFileSync(PUZZLES_FILE, '[]');
}
if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, '{}');
}

const puzzleSessions = new Map();
const REWARD_BASE = 5000;
const HINT_COOLDOWN = 30000;

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function normalizeAnswer(text) {
    return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
}

function checkAnswer(userAnswer, correctAnswer, variations = []) {
    const normalizedUser = normalizeAnswer(userAnswer);
    const normalizedCorrect = normalizeAnswer(correctAnswer);
    
    if (normalizedUser === normalizedCorrect) return true;
    
    return variations.some(variation => 
        normalizeAnswer(variation) === normalizedUser
    );
}

async function generatePuzzle() {
    const genAI = new GoogleGenerativeAI(API_KEYS[0]);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const categories = ["logic", "math"];
    const category = categories[Math.floor(Math.random() * categories.length)];

    const prompt = `Generate a ${category} puzzle and return it in this exact format without any additional text or formatting:
{
"question": "Write the puzzle question here in Vietnamese",
"answer": "Write the answer here",
"variations": ["alternative answer 1", "alternative answer 2"],
"hints": ["First basic hint", "More detailed hint", "Very specific hint"],
"explanation": "Write the solution explanation here",
"difficulty": 1,
"category": "${category}"
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text().trim();
        
        let jsonStr = response;
        
        jsonStr = jsonStr.replace(/```(json)?/g, '').trim();
        
        const startIndex = jsonStr.indexOf('{');
        const endIndex = jsonStr.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error('Invalid JSON structure');
        }
        
        jsonStr = jsonStr.slice(startIndex, endIndex + 1);
        
        try {
            const puzzle = JSON.parse(jsonStr);
            
            if (!puzzle.question || !puzzle.answer || !Array.isArray(puzzle.hints) || 
                !puzzle.explanation || !puzzle.difficulty || !puzzle.category ||
                !Array.isArray(puzzle.variations)) {
                throw new Error('Missing required fields');
            }
            
            return puzzle;
            
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Raw JSON string:', jsonStr);
            
            return {
                question: "Một người có 5 quả táo, chia đều cho 2 người. Làm thế nào để công bằng?",
                answer: "cắt đôi mỗi quả táo",
                hint: "Không nhất thiết phải chia nguyên quả",
                explanation: "Cắt đôi mỗi quả táo sẽ có 10 nửa quả, mỗi người nhận 5 nửa quả (2.5 quả)",
                difficulty: 1,
                category: "logic"
            };
        }
    } catch (error) {
        console.error('Generation Error:', error);
        throw error;
    }
}

module.exports = {
    name: "puzzle",
    dev: "HNT",
    onPrefix: true,
    category: "Games",
    info: "Giải câu đố logic/toán học",
    usages: "puzzle",
    cooldowns: 120,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;

        if (puzzleSessions.has(threadID)) {
            return api.sendMessage("⚠️ Đã có câu đố đang chờ giải!", threadID, messageID);
        }

        try {
            // Generate new puzzle
            const puzzle = await generatePuzzle();
            
            puzzleSessions.set(threadID, {
                ...puzzle,
                timestamp: Date.now(),
                attempts: 0,
                hintIndex: 0,
                lastHintTime: 0
            });

            let message = "🧩 CÂU ĐỐ AI 🧩\n";
            message += "━━━━━━━━━━━━━━━━━━\n\n";
            message += `📝 Thể loại: ${puzzle.category === "logic" ? "Logic" : "Toán học"}\n\n`;
            message += `❓ Câu hỏi:\n${puzzle.question}\n\n`;
            message += `💰 Phần thưởng: ${formatNumber(REWARD_BASE * puzzle.difficulty)}$\n`;
            message += `⭐ Độ khó: ${"⭐".repeat(puzzle.difficulty)}\n\n`;
            message += "💡 Gõ .puzzle hint để xem gợi ý\n";
            message += "👉 Reply tin nhắn để trả lời";

            const sent = await api.sendMessage(message, threadID);

            // Auto end after 5 minutes
            setTimeout(() => {
                const session = puzzleSessions.get(threadID);
                if (session && session.timestamp === puzzleSessions.get(threadID).timestamp) {
                    api.sendMessage(
                        "⌛ Hết thời gian!\n\n" +
                        `📝 Đáp án: ${session.answer}\n` +
                        `💡 Giải thích: ${session.explanation}`,
                        threadID
                    );
                    puzzleSessions.delete(threadID);
                }
            }, 300000);

            global.client.onReply.push({
                name: this.name,
                messageID: sent.messageID,
                author: senderID,
                type: "answer"
            });

        } catch (error) {
            console.error("Main error:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi tạo câu đố!", threadID, messageID);
        }
    },

    onReply: async function({ api, event }) {
        const { threadID, messageID, body } = event;
        const session = puzzleSessions.get(threadID);

        if (!session) return;

        const answer = body.trim();
        const isCorrect = checkAnswer(answer, session.answer, session.variations || []);

        session.attempts++;

        if (isCorrect) {
            const reward = REWARD_BASE * session.difficulty;
            await updateBalance(event.senderID, reward);

            let message = "🎉 CHÍNH XÁC!\n━━━━━━━━━━━━━━━━━━\n\n";
            message += `💡 Giải thích:\n${session.explanation}\n\n`;
            message += `💰 Phần thưởng: ${formatNumber(reward)}$\n`;
            message += `🎯 Số lần thử: ${session.attempts}`;
            
            api.sendMessage(message, threadID, messageID);
            puzzleSessions.delete(threadID);
            
        } else if (session.attempts >= 2 && 
                   session.hintIndex < session.hints.length && 
                   Date.now() - session.lastHintTime >= HINT_COOLDOWN) {
                   
            session.lastHintTime = Date.now();
            const hint = session.hints[session.hintIndex++];
            
            api.sendMessage(
                `❌ Sai rồi! Đây là gợi ý cho bạn (${session.hintIndex}/${session.hints.length}):\n` +
                `━━━━━━━━━━━━━━━━━━\n\n💡 ${hint}`,
                threadID, messageID
            );
            
        } else {
            api.sendMessage(
                `❌ Sai rồi! Còn ${5 - session.attempts} lần thử\n` +
                `${session.hintIndex < session.hints.length ? 
                    `Đợi ${Math.ceil((HINT_COOLDOWN - (Date.now() - session.lastHintTime))/1000)}s để nhận gợi ý tiếp theo` : 
                    "Đã hết gợi ý"}`, 
                threadID, messageID
            );
            
            if (session.attempts >= 5) {
                api.sendMessage(
                    "💔 Bạn đã thua!\n━━━━━━━━━━━━━━━━━━\n\n" +
                    `📝 Đáp án: ${session.answer}\n` +
                    `💡 Giải thích: ${session.explanation}`,
                    threadID
                );
                puzzleSessions.delete(threadID);
            }
        }
    }
};
