const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

// Register fonts
registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Bold.ttf'), { family: 'BeVietnam Bold' });
registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Medium.ttf'), { family: 'BeVietnam Medium' });
registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Regular.ttf'), { family: 'BeVietnam' });
registerFont(path.join(__dirname, '../../fonts/PlayfairDisplay-Bold.ttf'), { family: 'Playfair Display' });

// Cache for images
const imageCache = new Map();

/**
 * Helper function to load and cache images
 */
async function loadCachedImage(imagePath) {
    if (imageCache.has(imagePath)) {
        return imageCache.get(imagePath);
    }
    
    try {
        const image = await loadImage(imagePath);
        imageCache.set(imagePath, image);
        return image;
    } catch (error) {
        console.error(`Error loading image ${imagePath}:`, error);
        throw error;
    }
}

/**
 * Helper to format numbers with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Draw the background for the banking canvas
 */
function drawBackground(ctx, width, height) {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a2a6c');
    gradient.addColorStop(0.5, '#2d4386');
    gradient.addColorStop(1, '#283377');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add some subtle pattern
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 20; i++) {
        const size = Math.random() * 100 + 50;
        ctx.beginPath();
        ctx.arc(
            Math.random() * width, 
            Math.random() * height,
            size, 0, Math.PI * 2
        );
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
    
    // Add some financial symbols
    ctx.font = '60px Arial';
    const symbols = ['$', '₫', '€', '£', '¥', '฿'];
    for (let i = 0; i < 10; i++) {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        ctx.fillStyle = ['#ffffff', '#ffd700', '#c5c5c5'][Math.floor(Math.random() * 3)];
        ctx.fillText(symbol, Math.random() * width, Math.random() * height);
    }
    ctx.globalAlpha = 1.0;
    
    // Header bar
    const headerGradient = ctx.createLinearGradient(0, 0, width, 0);
    headerGradient.addColorStop(0, '#0a1538');
    headerGradient.addColorStop(1, '#152a5a');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, 80);
    
    // Footer bar
    ctx.fillStyle = '#0a1538';
    ctx.fillRect(0, height - 40, width, 40);
    
    // Lines across background (subtle)
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
}

/**
 * Draw the header with bank name
 */
function drawHeader(ctx, width) {
    ctx.font = '42px "Playfair Display"';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;
    ctx.fillText('AKI BANKING', width / 2, 40);
    ctx.shadowBlur = 0;
    
    const lineWidth = 200;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(width / 2 - lineWidth, 60);
    ctx.lineTo(width / 2 + lineWidth, 60);
    ctx.stroke();
    
    // Draw diamonds at ends of line
    drawDiamond(ctx, width / 2 - lineWidth, 60, 6);
    drawDiamond(ctx, width / 2 + lineWidth, 60, 6);
}

/**
 * Draw a diamond shape
 */
function drawDiamond(ctx, x, y, size) {
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw an account card with user's balance information
 */
function drawAccountCard(ctx, balanceData, x, y, width, height) {
    // Card background
    const cardGradient = ctx.createLinearGradient(x, y, x + width, y + height);
    cardGradient.addColorStop(0, '#141e30');
    cardGradient.addColorStop(1, '#243b55');
    
    // Card with glass effect
    ctx.fillStyle = cardGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 15);
    ctx.fill();
    
    // Card border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Card shine effect
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 10, width - 20, 20, 10);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // Bank logo
    ctx.font = '22px "Playfair Display"';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'left';
    ctx.fillText('AKI BANK', x + 25, y + 35);
    
    // Chip icon
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + width - 60, y + 25, 30, 25);
    
    // Draw balance information
    ctx.font = '16px "BeVietnam Medium"';
    ctx.fillStyle = '#b0c4de';
    ctx.fillText('Số dư ví:', x + 25, y + 70);
    ctx.fillText('Số dư ngân hàng:', x + 25, y + 100);
    ctx.fillText('Tổng tài sản:', x + 25, y + 130);
    
    ctx.font = '18px "BeVietnam Bold"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`${formatNumber(balanceData.wallet)} $`, x + width - 25, y + 70);
    ctx.fillText(`${formatNumber(balanceData.bank)} $`, x + width - 25, y + 100);
    
    // Total assets with highlight
    ctx.font = '20px "BeVietnam Bold"';
    ctx.fillStyle = '#4ecca3';
    ctx.fillText(`${formatNumber(balanceData.wallet + balanceData.bank)} $`, x + width - 25, y + 130);
    
    // VIP badge if applicable
    if (balanceData.vipLevel > 0) {
        const vipColors = ['#ffd700', '#e5e4e2', '#cd7f32'];
        ctx.fillStyle = vipColors[balanceData.vipLevel - 1] || '#ffd700';
        
        ctx.beginPath();
        ctx.roundRect(x + width - 105, y + 10, 80, 30, 15);
        ctx.fill();
        
        ctx.font = '18px "BeVietnam Bold"';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(`VIP ${balanceData.vipLevel}`, x + width - 65, y + 30);
        
        ctx.font = '14px "BeVietnam"';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'right';
        ctx.fillText(`Lãi suất: ${(balanceData.interestRate * 100).toFixed(2)}%/ngày`, x + width - 25, y + height - 12);
    }
}

function drawCreditScore(ctx, score, x, y, radius) {

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#142242';
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    const startAngle = Math.PI * 0.8;
    const endAngle = startAngle + (Math.PI * 1.4 * (score / 100));
    
    let color;
    if (score >= 80) color = '#4ecca3';
    else if (score >= 50) color = '#ffd700';
    else color = '#e94560';
    
    ctx.beginPath();
    ctx.arc(x, y, radius - 10, startAngle, endAngle);
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.stroke();
    
    ctx.font = '12px "BeVietnam"';
    ctx.fillStyle = '#b0c4de';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= 100; i += 20) {
        const angle = startAngle + (Math.PI * 1.4 * (i / 100));
        const tickX = x + Math.cos(angle) * (radius - 25);
        const tickY = y + Math.sin(angle) * (radius - 25);
        const labelX = x + Math.cos(angle) * (radius - 40);
        const labelY = y + Math.sin(angle) * (radius - 40);
        
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * (radius - 16), y + Math.sin(angle) * (radius - 16));
        ctx.lineTo(x + Math.cos(angle) * (radius - 5), y + Math.sin(angle) * (radius - 5));
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#b0c4de';
        ctx.stroke();
        
        ctx.fillText(i, labelX, labelY + 4);
    }
    
    ctx.font = '32px "BeVietnam Bold"';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(score, x, y - 5);
    
    ctx.font = '14px "BeVietnam Medium"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CREDIT SCORE', x, y + 50);
}

function drawFinancialIndicators(ctx, stats, x, y, width) {
    ctx.fillStyle = 'rgba(20, 30, 60, 0.8)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, 120, 15);
    ctx.fill();
    
    ctx.strokeStyle = '#4169e1';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = '18px "BeVietnam Bold"';
    ctx.fillStyle = '#4169e1';
    ctx.textAlign = 'left';
    ctx.fillText('📊 CHỈ SỐ TÀI CHÍNH', x + 20, y + 30);
    
    const riskColor = stats.riskScore >= 80 ? '#4ecca3' : 
                     stats.riskScore >= 50 ? '#ffd700' : '#e94560';
    const riskText = stats.riskScore >= 80 ? 'An toàn' : 
                    stats.riskScore >= 50 ? 'Bình thường' : 'Rủi ro';
    const riskEmoji = stats.riskScore >= 80 ? '💚' : 
                     stats.riskScore >= 50 ? '💛' : '❤️';
    
    const indicators = [
        { label: 'Độ tin cậy:', value: `${riskEmoji} ${riskText}`, color: riskColor },
        { label: 'Xếp hạng:', value: `#${stats.rank}`, color: '#ffffff' },
        { label: 'Giao dịch:', value: `${stats.transactionCount} lần`, color: '#ffffff' }
    ];
    
    const colWidth = width / 3;
    indicators.forEach((indicator, i) => {
        ctx.font = '14px "BeVietnam Medium"';
        ctx.fillStyle = '#b0c4de';
        ctx.textAlign = 'center';
        ctx.fillText(indicator.label, x + (i * colWidth) + colWidth/2, y + 60);
        
        ctx.font = '16px "BeVietnam Bold"';
        ctx.fillStyle = indicator.color;
        ctx.fillText(indicator.value, x + (i * colWidth) + colWidth/2, y + 85);
    });
    
    ctx.fillStyle = '#1e3060';
    ctx.beginPath();
    ctx.roundRect(x + 20, y + 100, width - 40, 8, 4);
    ctx.fill();
    
    const progressWidth = (width - 40) * (stats.riskScore / 100);
    ctx.fillStyle = riskColor;
    ctx.beginPath();
    ctx.roundRect(x + 20, y + 100, progressWidth, 8, 4);
    ctx.fill();
}

function drawActivityStreak(ctx, streak, x, y, width) {
    ctx.fillStyle = 'rgba(20, 30, 60, 0.8)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, 110, 15);
    ctx.fill();
    
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = '18px "BeVietnam Bold"';
    ctx.fillStyle = '#e94560';
    ctx.textAlign = 'left';
    ctx.fillText('🔥 CHUỖI HOẠT ĐỘNG', x + 20, y + 30);
    
    ctx.font = '16px "BeVietnam Medium"';
    ctx.fillStyle = '#b0c4de';
    ctx.fillText('Hiện tại:', x + 20, y + 60);
    
    ctx.font = '22px "BeVietnam Bold"';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`${streak.current} ngày`, x + 120, y + 60);
    
    if (streak.next) {
        ctx.font = '16px "BeVietnam Medium"';
        ctx.fillStyle = '#b0c4de';
        ctx.fillText('Mốc tiếp theo:', x + 20, y + 90);
        
        ctx.font = '18px "BeVietnam Bold"';
        ctx.fillStyle = '#4ecca3';
        ctx.fillText(`${streak.next.days} ngày (+${formatNumber(streak.next.reward)} $)`, x + 150, y + 90);
    }
    
    drawFlameIcon(ctx, x + width - 60, y + 55, 30);
}

function drawFlameIcon(ctx, x, y, size) {
 
    const time = Date.now() / 500;
    const flicker = Math.sin(time) * 0.2 + 0.8;
    
    ctx.fillStyle = '#e94560';
    ctx.beginPath();
    ctx.moveTo(x - size/2, y + size/2);
    ctx.quadraticCurveTo(x - size/4, y, x, y - size * flicker);
    ctx.quadraticCurveTo(x + size/4, y, x + size/2, y + size/2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(x - size/4, y + size/3);
    ctx.quadraticCurveTo(x - size/8, y, x, y - size * 0.7 * flicker);
    ctx.quadraticCurveTo(x + size/8, y, x + size/4, y + size/3);
    ctx.closePath();
    ctx.fill();
    
    ctx.globalAlpha = 0.5 * flicker;
    ctx.shadowColor = '#e94560';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
}

function drawAchievements(ctx, achievements, x, y, width) {
    ctx.fillStyle = 'rgba(20, 30, 60, 0.8)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, 120, 15);
    ctx.fill();
    
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = '18px "BeVietnam Bold"';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'left';
    ctx.fillText('🏆 THÀNH TỰU', x + 20, y + 30);
    
    if (achievements && achievements.length > 0) {
        const achievementsPerRow = 2;
        const rows = Math.ceil(achievements.length / achievementsPerRow);
        const cellWidth = width / achievementsPerRow;
        const cellHeight = 30;
        
        achievements.slice(0, 6).forEach((achievement, i) => {
            const row = Math.floor(i / achievementsPerRow);
            const col = i % achievementsPerRow;
            
            ctx.font = '16px "BeVietnam Medium"';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(achievement, x + 20 + col * cellWidth, y + 60 + row * cellHeight);
        });
        
        if (achievements.length > 6) {
            ctx.font = '14px "BeVietnam"';
            ctx.fillStyle = '#b0c4de';
            ctx.textAlign = 'right';
            ctx.fillText(`+${achievements.length - 6} thành tựu khác`, x + width - 20, y + 100);
        }
    } else {
        ctx.font = '16px "BeVietnam"';
        ctx.fillStyle = '#b0c4de';
        ctx.textAlign = 'center';
        ctx.fillText('❌ Chưa có thành tựu nào', x + width/2, y + 70);
    }
}

/**
 * Draw loan information if any
 */
function drawLoanInfo(ctx, loan, x, y, width) {
    if (!loan) return;
    
    ctx.fillStyle = 'rgba(20, 30, 60, 0.8)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, 140, 15);
    ctx.fill();
    
    const isOverdue = Date.now() > loan.dueDate;
    ctx.strokeStyle = isOverdue ? '#e94560' : '#4ecca3';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Section title with warning if overdue
    ctx.font = '18px "BeVietnam Bold"';
    ctx.fillStyle = isOverdue ? '#e94560' : '#4ecca3';
    ctx.textAlign = 'left';
    ctx.fillText(isOverdue ? '⚠️ KHOẢN VAY QUÁ HẠN' : '💰 KHOẢN VAY HIỆN TẠI', x + 20, y + 30);
    
    // Loan details
    const details = [
        { label: 'Số tiền gốc:', value: `${formatNumber(loan.amount)} $` },
        { label: 'Còn nợ:', value: `${formatNumber(loan.remainingAmount)} $` },
        { label: 'Ngày đến hạn:', value: new Date(loan.dueDate).toLocaleDateString('vi-VN') }
    ];
    
    details.forEach((detail, i) => {
        ctx.font = '16px "BeVietnam Medium"';
        ctx.fillStyle = '#b0c4de';
        ctx.textAlign = 'left';
        ctx.fillText(detail.label, x + 20, y + 60 + i * 30);
        
        ctx.font = '16px "BeVietnam Bold"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(detail.value, x + width - 20, y + 60 + i * 30);
    });
    
    // Days remaining
    const daysLeft = Math.ceil((loan.dueDate - Date.now()) / (24 * 60 * 60 * 1000));
    const daysLeftText = isOverdue ? 
        `Quá hạn ${Math.abs(daysLeft)} ngày` : 
        `Còn ${daysLeft} ngày`;
    
    ctx.font = '18px "BeVietnam Bold"';
    ctx.fillStyle = isOverdue ? '#e94560' : '#4ecca3';
    ctx.textAlign = 'center';
    ctx.fillText(daysLeftText, x + width/2, y + 120);
}

/**
 * Create a stream from buffer
 */
async function bufferToReadStream(buffer) {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `banking_${Date.now()}.png`);
    
    fs.writeFileSync(tempFilePath, buffer);
    
    const stream = fs.createReadStream(tempFilePath);
    
    stream.on('end', () => {
        try {
            fs.unlinkSync(tempFilePath);
        } catch (err) {
            console.error('Error cleaning up temp file:', err);
        }
    });
    
    return stream;
}

/**
 * Main function to create a banking canvas
 */
async function createBankingCanvas(data) {
    const canvas = createCanvas(800, 800);
    const ctx = canvas.getContext('2d');
    
    // Draw background and header
    drawBackground(ctx, canvas.width, canvas.height);
    drawHeader(ctx, canvas.width);
    
    // Draw account card with balances
    drawAccountCard(ctx, {
        wallet: data.walletBalance,
        bank: data.bankBalance,
        vipLevel: data.stats.vipStatus?.packageId || 0,
        interestRate: data.bankInterestRate || 0.001
    }, 50, 100, 700, 160);
    
    // Draw credit score gauge
    drawCreditScore(ctx, data.creditScore.score, 150, 350, 80);
    
    // Draw financial indicators
    drawFinancialIndicators(ctx, data.stats, 250, 280, 500);
    
    // Draw activity streak
    drawActivityStreak(ctx, {
        current: data.stats.streak,
        next: data.nextStreak
    }, 50, 430, 700);
    
    // Draw achievements
    drawAchievements(ctx, data.stats.achievements, 50, 550, 700);
    
    // Draw loan information if exists
    if (data.loan && data.loan.status === 'active') {
        drawLoanInfo(ctx, data.loan, 50, 680, 700);
    }
    
    // Footer text
    ctx.font = '14px "BeVietnam"';
    ctx.fillStyle = '#b0c4de';
    ctx.textAlign = 'center';
    ctx.fillText('AKI BANKING • BẢO MẬT • TIN CẬY • CHUYÊN NGHIỆP', canvas.width/2, canvas.height - 20);
    
    return canvas.toBuffer();
}

module.exports = {
    createBankingCanvas,
    bufferToReadStream
};