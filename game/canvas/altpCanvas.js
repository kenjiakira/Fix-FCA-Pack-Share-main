const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

// Register fonts if available
try {
    registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Bold.ttf'), { family: 'BeVietnam Bold' });
    registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Medium.ttf'), { family: 'BeVietnam Medium' });
    registerFont(path.join(__dirname, '../../fonts/MontserratSubrayada-Bold.ttf'), { family: 'Montserrat Subrayada' });
    registerFont(path.join(__dirname, '../../fonts/Montserrat-Bold.ttf'), { family: 'Montserrat Bold' });
} catch (e) {
    console.log("Font registration error:", e.message);
}

// Money ladder for the game
const MONEY_LADDER = [
    0, 200, 400, 600, 1000, 2000,
    4000, 8000, 16000, 32000, 64000,
    125000, 250000, 500000, 1000000
];

// Milestone levels (guaranteed money)
const MILESTONE_LEVELS = [5, 10, 15];

/**
 * Create main game canvas for Ai Là Triệu Phú
 * @param {Object} gameState - Current game state
 * @param {Object} question - Current question data
 * @param {Number} timeRemaining - Time remaining in seconds
 * @returns {Object} - Canvas object
 */
async function createAltpCanvas(data) {
    // Canvas setup - wide format for better money ladder display
    const canvas = createCanvas(1000, 800);
    const ctx = canvas.getContext('2d');
    
    // Background with luxurious gradient
    drawGameBackground(ctx, canvas.width, canvas.height);
    
    // Draw the game logo
    drawGameLogo(ctx, canvas.width);

    if (data.type === 'welcome') {
        // Draw welcome screen
        drawMoneyLadder(ctx, 0, canvas.width, canvas.height);
        drawWelcomeMessage(ctx, canvas.width);
    } else if (data.type === 'question') {
        // Draw game screen with question
        drawMoneyLadder(ctx, data.gameState.level, canvas.width, canvas.height);
        if (data.question) {
            drawQuestionArea(ctx, data.question, canvas.width);
            drawAnswerOptions(ctx, data.question.options, canvas.width);
        }
        drawLifelines(ctx, data.gameState.lifelines, canvas.width);
        if (data.timeLeft) {
            drawTimer(ctx, data.timeLeft, canvas.width);
        }
        drawPlayerInfo(ctx, data.gameState, canvas.width);
    }
    
    return canvas;
}
function drawWelcomeMessage(ctx, width) {
    ctx.font = "bold 36px 'BeVietnam Bold', Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    
    const centerX = width / 2;
    ctx.fillText("CHÀO MỪNG ĐẾN VỚI", centerX, 250);
    ctx.fillText("AI LÀ TRIỆU PHÚ", centerX, 300);
    
    ctx.font = "24px 'BeVietnam Medium', Arial";
    ctx.fillText("Reply READY để bắt đầu chơi", centerX, 380);
}
/**
 * Create a result canvas showing correct/incorrect answer
 * @param {Object} gameState - Current game state
 * @param {Object} question - Question that was answered
 * @param {String} userAnswer - User's answer (A, B, C, D)
 * @param {Boolean} isCorrect - Whether answer is correct
 * @returns {Object} - Canvas object
 */
async function createAltpResultCanvas(data) {
    const canvas = createCanvas(1000, 800);
    const ctx = canvas.getContext('2d');
    
    // Background with result-specific effects
    drawGameBackground(ctx, canvas.width, canvas.height, data.isCorrect);
    
    // Draw the game logo
    drawGameLogo(ctx, canvas.width);
    
    // Create a proper gameState object from the data
    const gameState = {
        level: data.level || 0,
        lifelines: data.lifelines || {}
    };
    
    // Draw money ladder with highlighted current level
    drawMoneyLadder(ctx, gameState.level, canvas.width, canvas.height, true);
    
    // Draw question if it exists
    if (data.question) {
        drawQuestionArea(ctx, data.question, canvas.width);
        
        // Draw answer options with highlighting
        if (data.question.options) {
            drawAnswerOptionsWithResult(ctx, 
                data.question.options, 
                data.question.correct, 
                data.answer, 
                canvas.width);
        }
    }
    
    // Draw result banner
    drawResultBanner(ctx, data.isCorrect, gameState, canvas.width);
    
    // Draw player info
    drawPlayerInfo(ctx, gameState, canvas.width);
    
    return canvas;
}
/**
 * Create a lifeline canvas for audience help
 * @param {Object} question - Current question
 * @param {Object} audienceResults - Percentage results from audience
 * @returns {Object} - Canvas object
 */
async function createAudienceHelpCanvas(question, audienceResults) {
    const canvas = createCanvas(800, 700);
    const ctx = canvas.getContext('2d');
    
    // Background
    drawGameBackground(ctx, canvas.width, canvas.height);
    
    // Draw title
    ctx.font = "bold 32px 'BeVietnam Bold', Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 15;
    ctx.fillText("HỎI Ý KIẾN KHÁN GIẢ", canvas.width / 2, 60);
    ctx.shadowBlur = 0;
    
    // Draw question
    ctx.font = "bold 22px 'BeVietnam Medium', Arial";
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, question.question, canvas.width / 2, 120, canvas.width - 80, 28, "center");
    
    // Draw chart background
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    roundRect(ctx, 100, 200, 600, 350, 10, true, true);
    
    // Draw chart title
    ctx.font = "bold 24px 'BeVietnam Bold', Arial";
    ctx.fillStyle = "#ffd700";
    ctx.fillText("KẾT QUẢ KHẢO SÁT", canvas.width / 2, 230);
    
    // Draw bar chart
    const barWidth = 100;
    const maxHeight = 250;
    const barSpacing = 40;
    const baseY = 500;
    const startX = (canvas.width - (barWidth * 4 + barSpacing * 3)) / 2;
    
    const options = ['A', 'B', 'C', 'D'];
    options.forEach((option, index) => {
        const percentage = audienceResults[option];
        const barHeight = (percentage / 100) * maxHeight;
        const x = startX + index * (barWidth + barSpacing);
        
        // Bar gradient
        const gradient = ctx.createLinearGradient(0, baseY - barHeight, 0, baseY);
        gradient.addColorStop(0, "#4ecca3");
        gradient.addColorStop(1, "#1b7a5a");
        
        // Draw bar
        ctx.fillStyle = gradient;
        roundRect(ctx, x, baseY - barHeight, barWidth, barHeight, 5, true, false);
        
        // Draw border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        roundRect(ctx, x, baseY - barHeight, barWidth, barHeight, 5, false, true);
        
        // Draw percentage
        ctx.font = "bold 24px 'BeVietnam Bold', Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${percentage}%`, x + barWidth / 2, baseY - barHeight - 10);
        
        // Draw option letter
        ctx.fillStyle = "#ffd700";
        ctx.fillText(option, x + barWidth / 2, baseY + 30);
    });
    
    // Draw footer
    ctx.font = "italic 18px 'BeVietnam Medium', Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Kết quả khảo sát từ khán giả trong trường quay", canvas.width / 2, 570);
    
    return canvas;
}

/**
 * Create a lifeline canvas for phone a friend
 * @param {String} friendResponse - The friend's response
 * @returns {Object} - Canvas object
 */
async function createPhoneAFriendCanvas(friendResponse) {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');
    
    // Background
    drawGameBackground(ctx, canvas.width, canvas.height);
    
    // Draw phone icon and header
    try {
        // Try to load phone icon
        const phoneIcon = await loadImage(path.join(__dirname, '../../commands/cache/phone.png'));
        ctx.drawImage(phoneIcon, canvas.width / 2 - 50, 60, 100, 100);
    } catch (err) {
        // Draw fallback phone icon
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 110, 50, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = "bold 50px Arial";
        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.fillText("📞", canvas.width / 2, 125);
    }
    
    // Draw title
    ctx.font = "bold 32px 'BeVietnam Bold', Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 15;
    ctx.fillText("GỌI ĐIỆN THOẠI CHO NGƯỜI THÂN", canvas.width / 2, 200);
    ctx.shadowBlur = 0;
    
    // Draw decorative phone line
    const lineY = 250;
    const lineGradient = ctx.createLinearGradient(100, lineY, canvas.width - 100, lineY);
    lineGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    lineGradient.addColorStop(0.5, "rgba(255, 215, 0, 1)");
    lineGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, lineY);
    ctx.lineTo(canvas.width - 100, lineY);
    ctx.stroke();
    
    // Draw friend response quote box
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    roundRect(ctx, 100, 280, canvas.width - 200, 200, 20, true, true);
    
    // Draw quote marks
    ctx.font = "bold 60px 'BeVietnam Bold', Arial";
    ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
    ctx.fillText("“", 120, 320);
    ctx.fillText("”", canvas.width - 120, 460);
    
    // Draw response text
    ctx.font = "22px 'BeVietnam Medium', Arial";
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, friendResponse, canvas.width / 2, 370, canvas.width - 300, 30, "center");
    
    // Draw footer
    ctx.font = "italic 18px 'BeVietnam Medium', Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Bạn có 30 giây để xem trả lời", canvas.width / 2, 520);
    
    return canvas;
}

/**
 * Create a lifeline canvas for 50:50
 * @param {Object} question - Current question
 * @param {Object} filteredOptions - Options after 50:50 filter
 * @returns {Object} - Canvas object
 */
async function createFiftyFiftyCanvas(question, filteredOptions) {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');
    
    // Background
    drawGameBackground(ctx, canvas.width, canvas.height);
    
    // Draw title
    ctx.font = "bold 32px 'BeVietnam Bold', Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 15;
    ctx.fillText("50:50", canvas.width / 2, 60);
    ctx.shadowBlur = 0;
    
    // Draw subtitle
    ctx.font = "bold 24px 'BeVietnam Medium', Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Đã loại bỏ hai phương án sai", canvas.width / 2, 100);
    
    // Draw question
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    roundRect(ctx, 50, 140, canvas.width - 100, 120, 10, true, true);
    
    ctx.font = "22px 'BeVietnam Medium', Arial";
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, question.question, canvas.width / 2, 180, canvas.width - 150, 28, "center");
    
    // Draw answer options
    const optionWidth = (canvas.width - 150) / 2;
    const optionHeight = 100;
    const optionStartY = 300;
    
    const optionPositions = [
        { x: 50, y: optionStartY },
        { x: canvas.width / 2 + 25, y: optionStartY },
        { x: 50, y: optionStartY + optionHeight + 30 },
        { x: canvas.width / 2 + 25, y: optionStartY + optionHeight + 30 }
    ];
    
    const optionLetters = ['A', 'B', 'C', 'D'];
    
    optionLetters.forEach((letter, index) => {
        const { x, y } = optionPositions[index];
        const isRemoved = filteredOptions[letter] === "---";
        
        ctx.fillStyle = isRemoved ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.5)";
        ctx.strokeStyle = isRemoved ? "rgba(255, 255, 255, 0.3)" : "#ffd700";
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, optionWidth, optionHeight, 10, true, true);
        
        // Draw option letter
        ctx.fillStyle = isRemoved ? "rgba(255, 255, 255, 0.3)" : "#ffd700";
        ctx.font = "bold 22px 'BeVietnam Bold', Arial";
        ctx.textAlign = "left";
        ctx.fillText(letter, x + 15, y + 30);
        
        // Draw option text or strikethrough for removed options
        ctx.font = isRemoved ? "italic 20px 'BeVietnam Medium', Arial" : "20px 'BeVietnam Medium', Arial";
        ctx.fillStyle = isRemoved ? "rgba(255, 255, 255, 0.3)" : "#ffffff";
        ctx.textAlign = "left";
        
        if (isRemoved) {
            ctx.fillText("Đã loại bỏ", x + 50, y + 30);
            
            // Draw strikethrough
            ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 50);
            ctx.lineTo(x + optionWidth - 10, y + 50);
            ctx.stroke();
        } else {
            wrapText(ctx, filteredOptions[letter], x + 50, y + 30, optionWidth - 70, 24, "left");
        }
    });
    
    // Draw footer
    ctx.font = "italic 18px 'BeVietnam Medium', Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Còn lại hai phương án - một đúng và một sai", canvas.width / 2, 550);
    
    return canvas;
}

/**
 * Draw the luxurious game background
 */
function drawGameBackground(ctx, width, height, resultState = null) {
    // Dark blue-purple gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    
    if (resultState === true) {
        // Winning background
        gradient.addColorStop(0, "#0a2e38");
        gradient.addColorStop(0.5, "#0d4d40");
        gradient.addColorStop(1, "#0a3b30");
    } else if (resultState === false) {
        // Losing background
        gradient.addColorStop(0, "#38100a");
        gradient.addColorStop(0.5, "#4d1f0d");
        gradient.addColorStop(1, "#3b0a0a");
    } else {
        // Normal background
        gradient.addColorStop(0, "#1a1a3a");
        gradient.addColorStop(0.5, "#0f1a3a");
        gradient.addColorStop(1, "#0a0a2a");
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add decorative hexagonal pattern
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    const hexSize = 50;
    const yOffset = 30;
    
    for (let row = -1; row < height / hexSize + 1; row++) {
        for (let col = -1; col < width / hexSize + 1; col++) {
            const x = col * hexSize * 1.5;
            const y = row * hexSize * Math.sqrt(3) + (col % 2) * (hexSize * Math.sqrt(3) / 2) + yOffset;
            drawHexagon(ctx, x, y, hexSize / 2);
        }
    }
    
    // Add subtle light rays
    ctx.fillStyle = "rgba(255, 215, 0, 0.02)";
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const centerX = width / 2;
        const centerY = height / 4;
        const rayLength = Math.max(width, height) * 1.5;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(angle - 0.15) * rayLength,
            centerY + Math.sin(angle - 0.15) * rayLength
        );
        ctx.lineTo(
            centerX + Math.cos(angle + 0.15) * rayLength,
            centerY + Math.sin(angle + 0.15) * rayLength
        );
        ctx.closePath();
        ctx.fill();
    }
    
    // Add vignette effect
    const vignetteGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 1.5
    );
    vignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add subtle noise effect
    ctx.fillStyle = "rgba(255, 255, 255, 0.01)";
    for (let i = 0; i < width * height * 0.005; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Draw the game logo
 */
function drawGameLogo(ctx, width) {
    // Add a decorative header
    const headerGradient = ctx.createLinearGradient(0, 0, width, 80);
    headerGradient.addColorStop(0, "rgba(0, 0, 0, 0.7)");
    headerGradient.addColorStop(0.5, "rgba(0, 0, 0, 0.5)");
    headerGradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
    
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, 80);
    
    // Game title with golden gradient
    const titleGradient = ctx.createLinearGradient(0, 20, 0, 60);
    titleGradient.addColorStop(0, "#ffd700");
    titleGradient.addColorStop(0.5, "#f8c200");
    titleGradient.addColorStop(1, "#daa520");
    
    ctx.font = "bold 36px 'Montserrat Bold', 'BeVietnam Bold', Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = titleGradient;
    
    // Add shadow for embossed effect
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText("AI LÀ TRIỆU PHÚ", width / 2, 50);
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    // Add decorative line
    const lineGradient = ctx.createLinearGradient(width / 2 - 200, 65, width / 2 + 200, 65);
    lineGradient.addColorStop(0, "rgba(255, 215, 0, 0.1)");
    lineGradient.addColorStop(0.5, "rgba(255, 215, 0, 0.8)");
    lineGradient.addColorStop(1, "rgba(255, 215, 0, 0.1)");
    
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 200, 65);
    ctx.lineTo(width / 2 + 200, 65);
    ctx.stroke();
    
    // Add diamond decorations
    drawDiamond(ctx, width / 2 - 200, 65, 8);
    drawDiamond(ctx, width / 2 + 200, 65, 8);
}

/**
 * Draw the money ladder
 */
function drawMoneyLadder(ctx, currentLevel, width, height, isResult = false) {
    const ladderWidth = 200;
    const ladderX = width - ladderWidth - 20;
    const ladderY = 100;
    const itemHeight = 30;
    const spacing = 5;
    
    // Draw ladder background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    roundRect(ctx, ladderX, ladderY, ladderWidth, 
              (itemHeight + spacing) * (MONEY_LADDER.length - 1) + 10, 10, true, true);
    
    // Draw ladder items
    for (let i = MONEY_LADDER.length - 1; i > 0; i--) {
        const y = ladderY + (MONEY_LADDER.length - 1 - i) * (itemHeight + spacing) + 10;
        const isMilestone = MILESTONE_LEVELS.includes(i);
        const isCurrent = i === currentLevel;
        const isPast = i < currentLevel;
        const isSafe = MILESTONE_LEVELS.find(level => level <= currentLevel && level >= i);
        
        // Determine background color
        let bgColor;
        if (isCurrent) {
            bgColor = isResult ? (isPast ? "rgba(78, 204, 163, 0.8)" : "rgba(233, 69, 96, 0.8)") : "rgba(255, 215, 0, 0.8)";
        } else if (isMilestone) {
            bgColor = "rgba(255, 255, 255, 0.3)";
        } else if (isPast) {
            bgColor = "rgba(78, 204, 163, 0.3)";
        } else if (isSafe) {
            bgColor = "rgba(78, 204, 163, 0.1)";
        } else {
            bgColor = "rgba(255, 255, 255, 0.1)";
        }
        
        // Determine text color
        const textColor = isCurrent ? "#000000" : (isMilestone ? "#ffd700" : "#ffffff");
        
        // Draw item background
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = isCurrent ? "#ffd700" : (isMilestone ? "#ffd700" : "rgba(255, 255, 255, 0.3)");
        ctx.lineWidth = isCurrent ? 2 : 1;
        roundRect(ctx, ladderX + 5, y, ladderWidth - 10, itemHeight, 5, true, true);
        
        // Draw money amount
        ctx.font = `${isCurrent ? 'bold ' : ''}18px 'BeVietnam ${isCurrent ? 'Bold' : 'Medium'}', Arial`;
        ctx.textAlign = "right";
        ctx.fillStyle = textColor;
        
        // Format number with commas
        const formattedMoney = MONEY_LADDER[i].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        
        // Add special marker for current level and milestones
        const prefix = isCurrent ? "▶️" : (isMilestone ? "⭐" : "");
        ctx.fillText(`${prefix}${formattedMoney}$`, ladderX + ladderWidth - 15, y + itemHeight / 2 + 6);
        
        // Add level number
        ctx.textAlign = "left";
        ctx.fillText(`${i}`, ladderX + 15, y + itemHeight / 2 + 6);
    }
    
    // Add title
    ctx.font = "bold 16px 'BeVietnam Bold', Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700";
    ctx.fillText("THANG ĐIỂM", ladderX + ladderWidth / 2, ladderY - 10);
}

/**
 * Draw question area
 */
function drawQuestionArea(ctx, question, width) {
    const questionWidth = width - 250; // Leave space for money ladder
    const questionY = 100;
    
    // Draw category banner
    ctx.fillStyle = "rgba(255, 215, 0, 0.2)";
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    roundRect(ctx, 20, questionY, questionWidth, 40, 10, true, true);
    
    ctx.font = "bold 18px 'BeVietnam Bold', Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700";
    // Add a fallback category if not present
    const category = question && question.category ? question.category : "Câu hỏi";
    ctx.fillText(category, 20 + questionWidth / 2, questionY + 25);
    
    // Draw question box
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    roundRect(ctx, 20, questionY + 50, questionWidth, 120, 10, true, true);
    
    // Draw question text
    ctx.font = "22px 'BeVietnam Medium', Arial";
    ctx.fillStyle = "#ffffff";
    // Add a fallback question text if not present
    const questionText = question && question.question ? question.question : "Đang tải câu hỏi...";
    wrapText(ctx, questionText, questionWidth / 2 + 20, questionY + 90, questionWidth - 40, 30, "center");
}

/**
 * Draw answer options
 */
function drawAnswerOptions(ctx, options, width) {
    const optionWidth = (width - 330) / 2; // Account for ladder and margins
    const optionHeight = 80;
    const startX = 20;
    const startY = 300;
    const spacing = 20;
    
    const optionPositions = [
        { x: startX, y: startY },
        { x: startX + optionWidth + spacing, y: startY },
        { x: startX, y: startY + optionHeight + spacing },
        { x: startX + optionWidth + spacing, y: startY + optionHeight + spacing }
    ];
    
    const optionLetters = ['A', 'B', 'C', 'D'];
    
    optionLetters.forEach((letter, index) => {
        const { x, y } = optionPositions[index];
        
        // Option background
        const gradient = ctx.createLinearGradient(x, y, x + optionWidth, y);
        gradient.addColorStop(0, "rgba(0, 0, 0, 0.6)");
        gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.4)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, optionWidth, optionHeight, 10, true, true);
        
        // Letter badge
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.arc(x + 25, y + optionHeight / 2, 18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#000000";
        ctx.font = "bold 20px 'BeVietnam Bold', Arial";
        ctx.textAlign = "center";
        ctx.fillText(letter, x + 25, y + optionHeight / 2 + 6);
        
        // Option text
        ctx.fillStyle = "#ffffff";
        ctx.font = "18px 'BeVietnam Medium', Arial";
        ctx.textAlign = "left";
        wrapText(ctx, options[letter], x + 55, y + optionHeight / 2 - 5, optionWidth - 70, 22, "left");
    });
}

/**
 * Draw answer options with result highlighting
 */
function drawAnswerOptionsWithResult(ctx, options, correctAnswer, userAnswer, width) {
    const optionWidth = (width - 330) / 2; // Account for ladder and margins
    const optionHeight = 80;
    const startX = 20;
    const startY = 300;
    const spacing = 20;
    
    const optionPositions = [
        { x: startX, y: startY },
        { x: startX + optionWidth + spacing, y: startY },
        { x: startX, y: startY + optionHeight + spacing },
        { x: startX + optionWidth + spacing, y: startY + optionHeight + spacing }
    ];
    
    const optionLetters = ['A', 'B', 'C', 'D'];
    
    optionLetters.forEach((letter, index) => {
        const { x, y } = optionPositions[index];
        const isCorrect = letter === correctAnswer;
        const isUserChoice = letter === userAnswer;
        
        // Option background with result-specific coloring
        let gradient;
        
        if (isCorrect) {
            gradient = ctx.createLinearGradient(x, y, x + optionWidth, y);
            gradient.addColorStop(0, "rgba(78, 204, 163, 0.8)");
            gradient.addColorStop(0.5, "rgba(78, 204, 163, 0.6)");
            gradient.addColorStop(1, "rgba(78, 204, 163, 0.8)");
        } else if (isUserChoice) {
            gradient = ctx.createLinearGradient(x, y, x + optionWidth, y);
            gradient.addColorStop(0, "rgba(233, 69, 96, 0.8)");
            gradient.addColorStop(0.5, "rgba(233, 69, 96, 0.6)");
            gradient.addColorStop(1, "rgba(233, 69, 96, 0.8)");
        } else {
            gradient = ctx.createLinearGradient(x, y, x + optionWidth, y);
            gradient.addColorStop(0, "rgba(0, 0, 0, 0.6)");
            gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.4)");
            gradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");
        }
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = isCorrect ? "#4ecca3" : (isUserChoice ? "#e94560" : "rgba(255, 255, 255, 0.3)");
        ctx.lineWidth = isCorrect || isUserChoice ? 3 : 2;
        roundRect(ctx, x, y, optionWidth, optionHeight, 10, true, true);
        
        ctx.fillStyle = isCorrect ? "#4ecca3" : (isUserChoice ? "#e94560" : "#ffd700");
        ctx.beginPath();
        ctx.arc(x + 25, y + optionHeight / 2, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Letter with appropriate contrast color
        ctx.fillStyle = "#000000"; // Black text works on all background colors
        ctx.font = "bold 20px 'BeVietnam Bold', Arial";
        ctx.textAlign = "center";
        ctx.fillText(letter, x + 25, y + optionHeight / 2 + 6);
        
        // Option text
        ctx.fillStyle = "#ffffff";
        ctx.font = "18px 'BeVietnam Medium', Arial";
        ctx.textAlign = "left";
        wrapText(ctx, options[letter], x + 55, y + optionHeight / 2 - 5, optionWidth - 70, 22, "left");
        
        // Draw correct/incorrect indicators
        if (isCorrect || isUserChoice) {
            ctx.font = "bold 16px 'BeVietnam Bold', Arial";
            ctx.textAlign = "right";
            ctx.fillStyle = isCorrect ? "#4ecca3" : "#e94560";
            ctx.fillText(isCorrect ? "✅ Đáp án đúng" : "❌ Sai", x + optionWidth - 15, y + optionHeight - 15);
        }
    });
}

function drawLifelines(ctx, lifelines, width) {
    const lifelineX = 20;
    const lifelineY = 520;
    const iconSize = 50;
    const spacing = 20;
    
    // Draw header
    ctx.font = "bold 18px 'BeVietnam Bold', Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffd700";
    ctx.fillText("TRỢ GIÚP:", lifelineX, lifelineY - 10);
    
    // Draw lifeline icons
    const lifelineTypes = Object.keys(lifelines);
    
    lifelineTypes.forEach((type, index) => {
        const x = lifelineX + index * (iconSize + spacing);
        const isUsed = !lifelines[type];
        
        // Draw background circle
        ctx.beginPath();
        ctx.arc(x + iconSize / 2, lifelineY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = isUsed ? "rgba(100, 100, 100, 0.5)" : "rgba(255, 215, 0, 0.2)";
        ctx.fill();
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = isUsed ? "rgba(150, 150, 150, 0.8)" : "#ffd700";
        ctx.stroke();
        
        // Draw icon
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = isUsed ? "rgba(150, 150, 150, 0.8)" : "#ffffff";
        
        let icon = "?";
        switch (type) {
            case "5050":
                icon = "50:50";
                break;
            case "AUDIENCE":
                icon = "👥";
                break;
            case "CALL":
                icon = "📞";
                break;
        }
        
        if (type === "5050") {
            ctx.font = "bold 16px 'BeVietnam Bold', Arial";
            ctx.fillText(icon, x + iconSize / 2, lifelineY + iconSize / 2 + 6);
        } else {
            ctx.font = "24px Arial";
            ctx.fillText(icon, x + iconSize / 2, lifelineY + iconSize / 2 + 8);
        }
        
        // Draw line through used lifelines
        if (isUsed) {
            ctx.beginPath();
            ctx.moveTo(x + 10, lifelineY + iconSize / 2);
            ctx.lineTo(x + iconSize - 10, lifelineY + iconSize / 2);
            ctx.strokeStyle = "rgba(233, 69, 96, 0.8)";
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    });
}

/**
 * Draw timer
 */
function drawTimer(ctx, timeRemaining, width) {
    const timerX = 20;
    const timerY = 600;
    const timerWidth = 200;
    const timerHeight = 40;
    
    // Draw timer label
    ctx.font = "bold 18px 'BeVietnam Bold', Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffd700";
    ctx.fillText("THỜI GIAN:", timerX, timerY - 10);
    
    // Draw timer background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    roundRect(ctx, timerX, timerY, timerWidth, timerHeight, 10, true, true);
    
    // Calculate percentage of time remaining
    const maxTime = 120; // 2 minutes
    const percentage = Math.min(1, timeRemaining / maxTime);
    
    // Determine color based on time remaining
    let color;
    if (percentage > 0.6) {
        color = "#4ecca3"; // Green for plenty of time
    } else if (percentage > 0.3) {
        color = "#dba506"; // Yellow/amber for medium time
    } else {
        color = "#e94560"; // Red for low time
    }
    
    // Draw timer bar
    ctx.fillStyle = color;
    roundRect(ctx, timerX + 5, timerY + 5, (timerWidth - 10) * percentage, timerHeight - 10, 5, true, false);
    
    // Format and draw time text
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    ctx.font = "bold 18px 'BeVietnam Bold', Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(formattedTime, timerX + timerWidth / 2, timerY + timerHeight / 2 + 6);
}

/**
 * Draw player info
 */
function drawPlayerInfo(ctx, gameState, width) {
    const playerInfoX = 20;
    const playerInfoY = 700;
    const infoWidth = 300;
    const infoHeight = 60;
    
    // Current prize - ensure we have valid values
    const currentPrize = gameState.level > 0 ? (MONEY_LADDER[gameState.level] || 0) : 0;
    
    // Fix for guaranteed prize calculation
    let guaranteedLevel = 0;
    const milestones = MILESTONE_LEVELS.filter(level => level <= gameState.level);
    if (milestones.length > 0) {
        guaranteedLevel = Math.max(...milestones);
    }
    const guaranteedPrize = MONEY_LADDER[guaranteedLevel] || 0;
    
    // Draw player info box
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    roundRect(ctx, playerInfoX, playerInfoY, infoWidth, infoHeight, 10, true, true);
    
    // Draw current prize - with null safety
    ctx.font = "bold 18px 'BeVietnam Bold', Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    
    // Safe formatting with fallback
    const formattedPrize = (currentPrize !== undefined && currentPrize !== null) 
        ? currentPrize.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        : "0";
    ctx.fillText(`Tiền thưởng: ${formattedPrize}$`, playerInfoX + 15, playerInfoY + 25);
    
    // Draw guaranteed prize - with null safety
    const formattedGuaranteed = (guaranteedPrize !== undefined && guaranteedPrize !== null)
        ? guaranteedPrize.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        : "0";
    ctx.font = "16px 'BeVietnam Medium', Arial";
    ctx.fillStyle = "#ffd700";
    ctx.fillText(`Mốc đảm bảo: ${formattedGuaranteed}$`, playerInfoX + 15, playerInfoY + 50);
    
    // Draw right side info - level
    ctx.font = "bold 22px 'BeVietnam Bold', Arial";
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffd700";
    ctx.fillText(`Câu hỏi: ${gameState.level}/15`, width - 40, playerInfoY + 35);
}
/**
 * Draw result banner
 */
function drawResultBanner(ctx, isCorrect, gameState, width) {
    // Calculate position - above the player info
    const bannerY = 600;
    const bannerHeight = 80;
    
    // Draw banner background
    ctx.fillStyle = isCorrect ? "rgba(78, 204, 163, 0.2)" : "rgba(233, 69, 96, 0.2)";
    ctx.strokeStyle = isCorrect ? "#4ecca3" : "#e94560";
    ctx.lineWidth = 3;
    roundRect(ctx, 20, bannerY, width - 250, bannerHeight, 10, true, true);
    
    // Get prize amount
    const currentLevel = gameState.level;
    const nextLevel = isCorrect ? currentLevel + 1 : currentLevel;
    const formattedPrize = MONEY_LADDER[nextLevel].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    // Draw result text
    ctx.font = "bold 28px 'BeVietnam Bold', Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = isCorrect ? "#4ecca3" : "#e94560";
    
    if (isCorrect) {
        ctx.fillText(`🎉 CHÍNH XÁC! TIẾN LÊN CÂU ${nextLevel}/15`, width / 2 - 125, bannerY + 35);
        
        ctx.font = "bold 22px 'BeVietnam Bold', Arial";
        ctx.fillText(`Tiền thưởng hiện tại: ${formattedPrize}$`, width / 2 - 125, bannerY + 65);
    } else {
        ctx.fillText(`❌ SAI RỒI!`, width / 2 - 125, bannerY + 35);
        
        const guaranteedLevel = Math.max(...MILESTONE_LEVELS.filter(level => level <= currentLevel));
        const guaranteedPrize = MONEY_LADDER[guaranteedLevel || 0];
        const formattedGuaranteed = guaranteedPrize.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        
        ctx.font = "bold 22px 'BeVietnam Bold', Arial";
        ctx.fillText(`Bạn ra về với ${formattedGuaranteed}$`, width / 2 - 125, bannerY + 65);
    }
}

/**
 * Helper function to draw a hexagon
 */
function drawHexagon(ctx, x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const hX = x + size * Math.cos(angle);
        const hY = y + size * Math.sin(angle);
        
        if (i === 0) {
            ctx.moveTo(hX, hY);
        } else {
            ctx.lineTo(hX, hY);
        }
    }
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw a diamond shape
 */
function drawDiamond(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = "#ffd700";
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
}

/**
 * Helper function to draw rounded rectangles
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

/**
 * Utility function to wrap text within a given width
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight, align = "left") {
    // Save original text alignment
    const originalAlign = ctx.textAlign;
    ctx.textAlign = align;
    
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineCount = 0;
    
    for (let n = 0; n < words.length; n++) {
        testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
            // Draw line based on alignment
            if (align === "center") {
                ctx.fillText(line, x, y);
            } else if (align === "right") {
                ctx.fillText(line, x, y);
            } else {
                ctx.fillText(line, x, y);
            }
            
            line = words[n] + ' ';
            y += lineHeight;
            lineCount++;
            
            if (lineCount >= 6) {
                // If too many lines, add ellipsis and stop
                if (align === "center") {
                    ctx.fillText(line + '...', x, y);
                } else if (align === "right") {
                    ctx.fillText(line + '...', x, y);
                } else {
                    ctx.fillText(line + '...', x, y);
                }
                break;
            }
        } else {
            line = testLine;
        }
    }
    
    if (lineCount < 6) {
        if (align === "center") {
            ctx.fillText(line, x, y);
        } else if (align === "right") {
            ctx.fillText(line, x, y);
        } else {
            ctx.fillText(line, x, y);
        }
    }
    
    // Restore original alignment
    ctx.textAlign = originalAlign;
}

/**
 * Helper to convert canvas to file stream
 */
async function canvasToStream(canvas, prefix = 'altp') {
    try {
        const tempDir = path.join(__dirname, './cache');
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
    createAltpCanvas,
    createAltpResultCanvas,
    createAudienceHelpCanvas,
    createPhoneAFriendCanvas,
    createFiftyFiftyCanvas,
    canvasToStream
};