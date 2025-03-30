const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

// Register fonts if available
try {
    registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Bold.ttf'), { family: 'BeVietnam Bold' });
    registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Medium.ttf'), { family: 'BeVietnam Medium' });
    registerFont(path.join(__dirname, '../../fonts/Montserrat-Bold.ttf'), { family: 'Montserrat Bold' });
    registerFont(path.join(__dirname, '../../fonts/Montserrat-SemiBold.ttf'), { family: 'Montserrat SemiBold' });
} catch (e) {
    console.log("Font registration error:", e.message);
}

// Category icons mapping
const CATEGORY_ICONS = {
    'khoa_hoc': '🔬',
    'lich_su': '📜',
    'dia_ly': '🌏',
    'van_hoa': '🏛️',
    'nghe_thuat': '🎨',
    'the_thao': '⚽',
    'cong_nghe': '💻',
    'toan_hoc': '🔢',
    'default': '❓'
};

// Category display names
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

// Difficulty colors
const DIFFICULTY_COLORS = {
    1: ['#9dc6fc', '#3d85c6'], // Easy - Light blue to blue
    2: ['#fce690', '#dba506'], // Medium - Yellow to gold
    3: ['#fc9090', '#cc0000'], // Hard - Light red to red
    default: ['#9adfad', '#2d9c5f'] // Default - Light green to green
};

/**
 * Create a beautiful canvas for a quiz question
 * @param {Object} quizData - Quiz question data
 * @param {Number} timeRemaining - Time remaining in seconds
 * @returns {Buffer} - Canvas buffer
 */
async function createQuizCanvas(quizData, timeRemaining = 120) {
    // Canvas setup
    const canvas = createCanvas(900, 800);
    const ctx = canvas.getContext('2d');
    
    // Draw beautiful background
    drawQuizBackground(ctx, canvas.width, canvas.height, quizData.category);
    
    // Draw time remaining indicator
    drawTimeRemaining(ctx, canvas.width, timeRemaining);
    
    // Draw category and difficulty indicator
    drawCategoryBadge(ctx, quizData.category, quizData.difficulty || 1);
    
    // Draw question
    drawQuestion(ctx, quizData.question, canvas.width);
    
    // Draw answer options
    drawAnswerOptions(ctx, quizData.options, canvas.width);
    
    // Draw footer with instructions
    drawFooter(ctx, canvas.width, canvas.height);
    
    // Return the canvas object instead of buffer
    return canvas;
}

/**
 * Create a canvas for the quiz result
 * @param {Object} quizData - Quiz question data
 * @param {String} userAnswer - User's answer (A, B, C, or D)
 * @param {Boolean} isCorrect - Whether the answer is correct
 * @param {Number} reward - Reward amount if correct
 * @returns {Object} - The canvas object (not the buffer)
 */
async function createQuizResultCanvas(quizData, userAnswer, isCorrect, reward = 1000) {
    // Canvas setup
    const canvas = createCanvas(900, 900);
    const ctx = canvas.getContext('2d');
    
    // Draw beautiful background with result-specific effects
    drawQuizBackground(ctx, canvas.width, canvas.height, quizData.category, isCorrect);
    
    // Draw question first
    drawQuestion(ctx, quizData.question, canvas.width, true);
    
    // Draw all answer options with highlighting
    drawAnswerOptionsWithResult(ctx, quizData.options, quizData.correct, userAnswer, canvas.width);
    
    // Draw result banner AFTER answers (moved from before answers)
    drawResultBanner(ctx, canvas.width, isCorrect, reward);
    
    // Draw explanation if available (adjust position if needed)
    if (quizData.explanation) {
        drawExplanation(ctx, quizData.explanation, canvas.width, canvas.height);
    }
    
    // Draw footer
    drawResultFooter(ctx, canvas.width, canvas.height);
    
    // Return the canvas object
    return canvas;
}

/**
 * Draw result banner BELOW the answer options
 */
function drawQuizBackground(ctx, width, height, category, isResult = false) {
    // Create a gradient background based on category theme
    const colorMap = {
        'khoa_hoc': ['#081b29', '#0a2942'],
        'lich_su': ['#2c1a0e', '#3d2414'],
        'dia_ly': ['#0f2b16', '#15422c'],
        'van_hoa': ['#2b1648', '#3a1e5e'],
        'nghe_thuat': ['#2d1c2c', '#412940'],
        'the_thao': ['#1c2c2d', '#253e3f'],
        'cong_nghe': ['#1e1e30', '#2a2a45'],
        'toan_hoc': ['#1f2938', '#2c384f'],
        'default': ['#202020', '#303030']
    };
    
    const colors = colorMap[category] || colorMap.default;
    
    // Main background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw decorative elements in the background
    ctx.globalAlpha = 0.05;
    
    // Small dots pattern
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < width; i += 20) {
        for (let j = 0; j < height; j += 20) {
            if (Math.random() > 0.85) {
                const size = Math.random() * 3 + 1;
                ctx.beginPath();
                ctx.arc(i, j, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Large decorative circles
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 150 + 50;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Add subtle grid pattern
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
    }
    
    for (let i = 0; i < height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
    }
    
    // Reset alpha
    ctx.globalAlpha = 1;
    
    // Add top bar header
    const headerGradient = ctx.createLinearGradient(0, 0, width, 80);
    headerGradient.addColorStop(0, "rgba(0, 0, 0, 0.5)");
    headerGradient.addColorStop(1, "rgba(0, 0, 0, 0.3)");
    
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, 80);
    
    // Add quiz title
    ctx.font = "bold 36px 'BeVietnam Bold', 'Montserrat Bold', Arial";
    ctx.textAlign = "center";
    
    // Add glow effect to the title
    ctx.shadowColor = isResult ? (isResult === true ? "rgba(78, 204, 163, 0.8)" : "rgba(233, 69, 96, 0.8)") : "rgba(255, 255, 255, 0.8)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = isResult ? (isResult === true ? "#4ecca3" : "#e94560") : "#ffffff";
    ctx.fillText(isResult ? "KẾT QUẢ QUIZ" : "QUIZ CHALLENGE", width / 2, 50);
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Add decorative line under the header
    const lineGradient = ctx.createLinearGradient(width / 2 - 200, 70, width / 2 + 200, 70);
    lineGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
    lineGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.6)");
    lineGradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
    
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 200, 70);
    ctx.lineTo(width / 2 + 200, 70);
    ctx.stroke();
    
    // Draw diamond decorations at line ends
    drawDiamond(ctx, width / 2 - 200, 70, 5);
    drawDiamond(ctx, width / 2 + 200, 70, 5);
}

/**
 * Draw a diamond shape
 */
function drawDiamond(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
}

/**
 * Draw time remaining indicator
 */
function drawTimeRemaining(ctx, width, timeRemaining) {
    const maxTime = 120; // 2 minutes
    const percentage = Math.min(1, timeRemaining / maxTime);
    const barWidth = 200;
    const barHeight = 10;
    const barX = width - 250;
    const barY = 40;
    
    // Draw time text
    ctx.font = "16px 'BeVietnam Medium', Arial";
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    ctx.fillText(`⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`, barX - 10, barY + 5);
    
    // Draw time bar background
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.roundRect(barX, barY - 5, barWidth, barHeight, 5);
    ctx.fill();
    
    // Draw time bar fill
    let fillColor;
    
    if (percentage > 0.6) {
        fillColor = "#4ecca3"; // Green for plenty of time
    } else if (percentage > 0.3) {
        fillColor = "#dba506"; // Yellow for medium time
    } else {
        fillColor = "#e94560"; // Red for low time
    }
    
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY - 5, barWidth * percentage, barHeight, 5);
    ctx.fill();
}

/**
 * Draw category badge
 */
function drawCategoryBadge(ctx, category, difficulty) {
    const categoryIcon = CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
    const categoryName = CATEGORY_NAMES[category] || CATEGORY_NAMES.default;
    const difficultyColors = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.default;
    
    // Draw category badge background
    const badgeGradient = ctx.createLinearGradient(20, 40, 200, 40);
    badgeGradient.addColorStop(0, difficultyColors[0]);
    badgeGradient.addColorStop(1, difficultyColors[1]);
    
    ctx.fillStyle = badgeGradient;
    ctx.beginPath();
    ctx.roundRect(20, 25, 220, 30, 15);
    ctx.fill();
    
    // Draw category text
    ctx.font = "bold 16px 'BeVietnam Bold', Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#000000";
    ctx.fillText(`${categoryIcon} ${categoryName}`, 30, 46);
    
    // Draw difficulty stars
    let stars = "★";
    if (difficulty === 2) stars = "★★";
    if (difficulty === 3) stars = "★★★";
    
    ctx.textAlign = "right";
    ctx.fillText(stars, 230, 46);
}

/**
 * Draw question text with nice formatting
 */
function drawQuestion(ctx, questionText, width, isResult = false) {
    const questionBoxY = 100;
    const questionWidth = width - 80;
    
    // Draw question box
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.roundRect(40, questionBoxY, questionWidth, 150, 10);
    ctx.fill();
    
    // Add subtle border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, questionBoxY, questionWidth, 150, 10);
    ctx.stroke();
    
    // Draw question title
    ctx.font = "16px 'BeVietnam Medium', Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#9dc6fc";
    ctx.fillText("CÂU HỎI:", 60, questionBoxY + 30);
    
    // Draw question text with wrapping
    ctx.font = `bold ${isResult ? "22px" : "24px"} 'BeVietnam Bold', Arial`;
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, questionText, 60, questionBoxY + 70, questionWidth - 40, 32);
}

/**
 * Draw answer options in a 2x2 grid
 */
function drawAnswerOptions(ctx, options, width) {
    const startY = 280;
    const optionWidth = (width - 100) / 2;
    const optionHeight = 160;
    const padding = 20;
    
    const optionCoordinates = [
        { x: 50, y: startY },
        { x: 50 + optionWidth + padding, y: startY },
        { x: 50, y: startY + optionHeight + padding },
        { x: 50 + optionWidth + padding, y: startY + optionHeight + padding }
    ];
    
    const optionLetters = ['A', 'B', 'C', 'D'];
    const optionTexts = [options.A, options.B, options.C, options.D];
    
    for (let i = 0; i < 4; i++) {
        const { x, y } = optionCoordinates[i];
        
        // Draw option background
        const gradient = ctx.createLinearGradient(x, y, x + optionWidth, y + optionHeight);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0.05)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, optionWidth, optionHeight, 10);
        ctx.fill();
        
        // Draw option border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, optionWidth, optionHeight, 10);
        ctx.stroke();
        
        // Draw option letter badge
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(x + 10, y + 10, 30, 30, 15);
        ctx.fill();
        
        // Draw option letter
        ctx.font = "bold 18px 'BeVietnam Bold', Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "#000000";
        ctx.fillText(optionLetters[i], x + 25, y + 30);
        
        // Draw option text
        ctx.font = "18px 'BeVietnam Medium', Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        wrapText(ctx, optionTexts[i], x + 50, y + 35, optionWidth - 60, 24);
    }
}

/**
 * Draw answer options with result highlighting
 */
function drawAnswerOptionsWithResult(ctx, options, correctAnswer, userAnswer, width) {
    const startY = 280;
    const optionWidth = (width - 100) / 2;
    const optionHeight = 160;
    const padding = 20;
    
    const optionCoordinates = [
        { x: 50, y: startY },
        { x: 50 + optionWidth + padding, y: startY },
        { x: 50, y: startY + optionHeight + padding },
        { x: 50 + optionWidth + padding, y: startY + optionHeight + padding }
    ];
    
    const optionLetters = ['A', 'B', 'C', 'D'];
    const optionTexts = [options.A, options.B, options.C, options.D];
    
    for (let i = 0; i < 4; i++) {
        const { x, y } = optionCoordinates[i];
        const letter = optionLetters[i];
        const isCorrect = letter === correctAnswer;
        const isUserChoice = letter === userAnswer;
        
        // Determine background color based on correctness and user choice
        let gradientColors;
        
        if (isCorrect) {
            gradientColors = ["rgba(78, 204, 163, 0.3)", "rgba(78, 204, 163, 0.1)"]; // Correct answer
        } else if (isUserChoice) {
            gradientColors = ["rgba(233, 69, 96, 0.3)", "rgba(233, 69, 96, 0.1)"]; // Wrong choice
        } else {
            gradientColors = ["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]; // Neutral
        }
        
        // Draw option background
        const gradient = ctx.createLinearGradient(x, y, x + optionWidth, y + optionHeight);
        gradient.addColorStop(0, gradientColors[0]);
        gradient.addColorStop(1, gradientColors[1]);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, optionWidth, optionHeight, 10);
        ctx.fill();
        
        // Draw option border
        ctx.strokeStyle = isCorrect ? "#4ecca3" : (isUserChoice ? "#e94560" : "rgba(255, 255, 255, 0.3)");
        ctx.lineWidth = isCorrect || isUserChoice ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(x, y, optionWidth, optionHeight, 10);
        ctx.stroke();
        
        // Draw option letter badge
        ctx.fillStyle = isCorrect ? "#4ecca3" : (isUserChoice ? "#e94560" : "#ffffff");
        ctx.beginPath();
        ctx.roundRect(x + 10, y + 10, 30, 30, 15);
        ctx.fill();
        
        // Draw option letter
        ctx.font = "bold 18px 'BeVietnam Bold', Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = isCorrect || isUserChoice ? "#ffffff" : "#000000";
        ctx.fillText(letter, x + 25, y + 30);
        
        // Draw option text
        ctx.font = "18px 'BeVietnam Medium', Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        wrapText(ctx, optionTexts[i], x + 50, y + 35, optionWidth - 60, 24);
        
        // Draw correct/incorrect indicator
        if (isCorrect || isUserChoice) {
            ctx.font = "bold 16px 'BeVietnam Bold', Arial";
            ctx.textAlign = "right";
            ctx.fillStyle = isCorrect ? "#4ecca3" : "#e94560";
            ctx.fillText(isCorrect ? "✓ Đáp án đúng" : "✗ Sai", x + optionWidth - 15, y + optionHeight - 15);
        }
    }
}

/**
 * Draw result banner
 */
function drawResultBanner(ctx, width, isCorrect, reward) {
    // Position the banner AFTER the answer options (which end at around y=620)
    const bannerY = 640; // Changed from 100 to 640
    
    // Draw result banner
    ctx.fillStyle = isCorrect ? "rgba(78, 204, 163, 0.2)" : "rgba(233, 69, 96, 0.2)";
    ctx.beginPath();
    ctx.roundRect(40, bannerY, width - 80, 70, 10);
    ctx.fill();
    
    ctx.strokeStyle = isCorrect ? "#4ecca3" : "#e94560";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(40, bannerY, width - 80, 70, 10);
    ctx.stroke();
    
    // Draw result icon and text
    ctx.font = "bold 32px 'BeVietnam Bold', Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = isCorrect ? "#4ecca3" : "#e94560";
    
    if (isCorrect) {
        ctx.fillText(`🎉 CHÚC MỪNG! BẠN TRẢ LỜI ĐÚNG +${reward}$`, width / 2, bannerY + 45);
    } else {
        ctx.fillText("❌ TIẾC QUÁ! BẠN TRẢ LỜI SAI", width / 2, bannerY + 45);
    }
}

/**
 * Draw explanation text (moved down to accommodate the new banner position)
 */
function drawExplanation(ctx, explanation, width, height) {
    const explanationY = 730; // Changed from 650 to 730
    
    // Draw explanation box
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.roundRect(40, explanationY, width - 80, 150, 10);
    ctx.fill();
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, explanationY, width - 80, 150, 10);
    ctx.stroke();
    
    // Draw explanation title
    ctx.font = "bold 18px 'BeVietnam Bold', Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#9dc6fc";
    ctx.fillText("GIẢI THÍCH:", 60, explanationY + 30);
    
    // Draw explanation text
    ctx.font = "18px 'BeVietnam Medium', Arial";
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, explanation, 60, explanationY + 60, width - 120, 24);
}
/**
 * Draw footer with instructions
 */
function drawFooter(ctx, width, height) {
    const footerY = height - 90;
    
    // Draw footer background
    const footerGradient = ctx.createLinearGradient(0, footerY, 0, height);
    footerGradient.addColorStop(0, "rgba(0, 0, 0, 0.0)");
    footerGradient.addColorStop(0.3, "rgba(0, 0, 0, 0.5)");
    footerGradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
    
    ctx.fillStyle = footerGradient;
    ctx.fillRect(0, footerY, width, 90);
    
    // Draw instruction text
    ctx.font = "bold 20px 'BeVietnam Bold', Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("💡 Trả lời bằng cách reply tin nhắn với A, B, C hoặc D", width / 2, footerY + 35);
    
    // Draw reward info
    ctx.font = "18px 'BeVietnam Medium', Arial";
    ctx.fillStyle = "#ffd700";
    ctx.fillText("💰 Phần thưởng: 1,000$", width / 2, footerY + 65);
}

/**
 * Draw result footer
 */
function drawResultFooter(ctx, width, height) {
    const footerY = height - 80;
    
    // Draw footer background
    const footerGradient = ctx.createLinearGradient(0, footerY, 0, height);
    footerGradient.addColorStop(0, "rgba(0, 0, 0, 0.0)");
    footerGradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
    
    ctx.fillStyle = footerGradient;
    ctx.fillRect(0, footerY, width, 80);
    
    // Draw footer text
    ctx.font = "bold 18px 'BeVietnam Bold', Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("🎮 Dùng .quiz để chơi câu hỏi mới", width / 2, footerY + 40);
}

/**
 * Utility function to wrap text within a given width
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineCount = 0;

    for (let n = 0; n < words.length; n++) {
        testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
            lineCount++;
            
            if (lineCount >= 4) {
                // If we have more than 4 lines, add ellipsis and stop
                ctx.fillText(line + '...', x, y);
                break;
            }
        } else {
            line = testLine;
        }
    }
    
    if (lineCount < 4) {
        ctx.fillText(line, x, y);
    }
}

async function canvasToStream(canvas, prefix = 'quiz') {
    try {
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const filePath = path.join(tempDir, `${prefix}_${Date.now()}.png`);
        
        // Get buffer directly from canvas
        const buffer = canvas.toBuffer('image/png');
        
        // Write buffer to file
        fs.writeFileSync(filePath, buffer);
        
        // Create read stream for the file
        const stream = fs.createReadStream(filePath);
        
        // Set up automatic cleanup
        stream.on('end', () => {
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                console.error('Error deleting temp file:', err);
            }
        });
        
        return stream;
    } catch (error) {
        console.error('Error in canvasToStream:', error);
        throw error;
    }
}
module.exports = {
    createQuizCanvas,
    createQuizResultCanvas,
    canvasToStream
};