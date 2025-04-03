const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

// Đăng ký fonts
const fontsPath = path.join(__dirname, '../../fonts');
registerFont(path.join(fontsPath, 'BeVietnamPro-Bold.ttf'), { family: 'BeVietnamPro', weight: 'bold' });
registerFont(path.join(fontsPath, 'BeVietnamPro-Medium.ttf'), { family: 'BeVietnamPro', weight: 'normal' });
registerFont(path.join(fontsPath, 'Saiyan-Sans.ttf'), { family: 'Saiyan' });

// Định nghĩa màu sắc cho mỗi hành tinh
const PLANET_COLORS = {
    "EARTH": {
        primary: '#4CAF50',
        secondary: '#81C784',
        accent: '#2E7D32',
        background: 'rgba(76, 175, 80, 0.2)'
    },
    "NAMEK": {
        primary: '#7986CB',
        secondary: '#9FA8DA',
        accent: '#3949AB',
        background: 'rgba(121, 134, 203, 0.2)'
    },
    "SAIYAN": {
        primary: '#E53935',
        secondary: '#EF5350',
        accent: '#B71C1C',
        background: 'rgba(229, 57, 53, 0.2)'
    }
};

// Tạo hình ảnh cho phần đầu trận đấu (Phase 1)
async function createBattlePhase1Image(battleData) {
    const { player1, player2, logs, phase } = battleData;
    const width = 1000;
    const height = 1600;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, width, height);
    
    // Header
    drawBattleHeader(ctx, player1, player2, width);
    
    // Phase indicator
    drawPhaseIndicator(ctx, 1, "KHỞI ĐẦU TRẬN ĐẤU", width, 220);
    
    // Player stats
    drawPlayerStats(ctx, player1, player2, width, 300);
    
    // Battle logs
    drawBattleLogs(ctx, logs, width, 500, height - 100);
    
    // Footer
    drawFooter(ctx, "Giai đoạn khởi đầu", width, height - 60);
    
    // Save image
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    const outputPath = path.join(__dirname, '../../temp', `battle_phase1_${Date.now()}.jpg`);
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
}

// Tạo hình ảnh cho giai đoạn giữa trận đấu (Phase 2)
async function createBattlePhase2Image(battleData) {
    const { player1, player2, logs, phase } = battleData;
    const width = 1000;
    const height = 1600;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, width, height);
    
    // Header
    drawBattleHeader(ctx, player1, player2, width);
    
    // Phase indicator
    drawPhaseIndicator(ctx, 2, "GIỮA TRẬN CAM GO", width, 220);
    
    // Player current stats
    drawPlayerCurrentStats(ctx, player1, player2, width, 300);
    
    // Battle logs
    drawBattleLogs(ctx, logs, width, 500, height - 100);
    
    // Footer
    drawFooter(ctx, "Giai đoạn quyết liệt", width, height - 60);
    
    // Save image
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    const outputPath = path.join(__dirname, '../../temp', `battle_phase2_${Date.now()}.jpg`);
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
}

// Tạo hình ảnh cho phần kết thúc trận đấu (Phase 3)
async function createBattlePhase3Image(battleData) {
    const { player1, player2, logs, winner, loser, stats } = battleData;
    const width = 1000;
    const height = 1800;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, width, height);
    
    // Header
    drawBattleHeader(ctx, player1, player2, width);
    
    // Phase indicator
    drawPhaseIndicator(ctx, 3, "HỒI KẾT TRẬN ĐẤU", width, 220);
    
    // Battle logs for finale
    drawBattleLogs(ctx, logs, width, 270, 700);
    
    // Result section
    drawBattleResult(ctx, player1, player2, winner, stats, width, 750);
    
    // Footer
    drawFooter(ctx, "Kết thúc trận đấu", width, height - 60);
    
    // Save image
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    const outputPath = path.join(__dirname, '../../temp', `battle_phase3_${Date.now()}.jpg`);
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
}

// Function để vẽ header trận đấu
function drawBattleHeader(ctx, player1, player2, width) {
    ctx.fillStyle = '#FF9800';
    ctx.font = '48px Saiyan';
    ctx.textAlign = 'center';
    ctx.fillText("DRAGON BALL Z - PVP BATTLE", width / 2, 60);
    
    // Vẽ VS Screen
    ctx.font = 'bold 32px BeVietnamPro';
    
    // Player 1
    ctx.fillStyle = PLANET_COLORS[player1.planet]?.primary || '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText(player1.name, width / 2 - 30, 120);
    
    // VS text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText("VS", width / 2, 120);
    
    // Player 2
    ctx.fillStyle = PLANET_COLORS[player2.planet]?.primary || '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(player2.name, width / 2 + 30, 120);
    
    // Player races
    ctx.font = '24px Saiyan';
    ctx.textAlign = 'right';
    ctx.fillText(player1.race, width / 2 - 30, 155);
    
    ctx.textAlign = 'left';
    ctx.fillText(player2.race, width / 2 + 30, 155);
    
    // Divider
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 180);
    ctx.lineTo(width - 100, 180);
    ctx.stroke();
}

// Function để vẽ indicator giai đoạn
function drawPhaseIndicator(ctx, phase, phaseText, width, y) {
    ctx.fillStyle = '#FFEB3B';
    ctx.font = '36px Saiyan';
    ctx.textAlign = 'center';
    ctx.fillText(`GIAI ĐOẠN ${phase}: ${phaseText}`, width / 2, y);
}

// Function để vẽ thông tin người chơi
function drawPlayerStats(ctx, player1, player2, width, startY) {
    const leftX = 100;
    const rightX = width - 100;
    const centerX = width / 2;
    
    ctx.font = 'bold 24px BeVietnamPro';
    
    // Player 1 stats
    ctx.fillStyle = PLANET_COLORS[player1.planet]?.primary || '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(`${player1.name} - ${player1.race}`, leftX, startY);
    
    ctx.font = '22px BeVietnamPro';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Sức mạnh: ${formatNumber(player1.stats.power)}`, leftX, startY + 40);
    ctx.fillText(`Sức đánh: ${formatNumber(player1.stats.damage)}`, leftX, startY + 70);
    ctx.fillText(`HP: ${formatNumber(player1.stats.health)}`, leftX, startY + 100);
    ctx.fillText(`Ki: ${formatNumber(player1.stats.ki)}`, leftX, startY + 130);
    
    // Player 2 stats
    ctx.fillStyle = PLANET_COLORS[player2.planet]?.primary || '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.font = 'bold 24px BeVietnamPro';
    ctx.fillText(`${player2.name} - ${player2.race}`, rightX, startY);
    
    ctx.font = '22px BeVietnamPro';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Sức mạnh: ${formatNumber(player2.stats.power)}`, rightX, startY + 40);
    ctx.fillText(`Sức đánh: ${formatNumber(player2.stats.damage)}`, rightX, startY + 70);
    ctx.fillText(`HP: ${formatNumber(player2.stats.health)}`, rightX, startY + 100);
    ctx.fillText(`Ki: ${formatNumber(player2.stats.ki)}`, rightX, startY + 130);
    
    // Center divider
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, startY - 20);
    ctx.lineTo(centerX, startY + 150);
    ctx.stroke();
}

// Function để vẽ thông tin hiện tại của người chơi (sử dụng trong phase 2)
function drawPlayerCurrentStats(ctx, player1, player2, width, startY) {
    const leftX = 100;
    const rightX = width - 100;
    const centerX = width / 2;
    
    ctx.font = 'bold 24px BeVietnamPro';
    
    // Player 1 stats
    ctx.fillStyle = PLANET_COLORS[player1.planet]?.primary || '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(`${player1.name}`, leftX, startY);
    
    // HP & Ki bars for player 1
    const p1HpPercent = Math.min(100, Math.max(0, (player1.currentHP / player1.stats.health) * 100));
    const p1KiPercent = Math.min(100, Math.max(0, (player1.currentKi / player1.stats.ki) * 100));
    
    // HP bar
    drawProgressBar(ctx, leftX, startY + 20, 300, 25, p1HpPercent, '#E53935', '#5D4037', 
                   `HP: ${formatNumber(player1.currentHP)}/${formatNumber(player1.stats.health)}`);
    
    // Ki bar
    drawProgressBar(ctx, leftX, startY + 60, 300, 25, p1KiPercent, '#2196F3', '#303F9F',
                   `Ki: ${formatNumber(player1.currentKi)}/${formatNumber(player1.stats.ki)}`);
    
    // Player 2 stats
    ctx.fillStyle = PLANET_COLORS[player2.planet]?.primary || '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText(`${player2.name}`, rightX, startY);
    
    // HP & Ki bars for player 2
    const p2HpPercent = Math.min(100, Math.max(0, (player2.currentHP / player2.stats.health) * 100));
    const p2KiPercent = Math.min(100, Math.max(0, (player2.currentKi / player2.stats.ki) * 100));
    
    // HP bar
    drawProgressBar(ctx, rightX - 300, startY + 20, 300, 25, p2HpPercent, '#E53935', '#5D4037', 
                   `HP: ${formatNumber(player2.currentHP)}/${formatNumber(player2.stats.health)}`, 'right');
    
    // Ki bar
    drawProgressBar(ctx, rightX - 300, startY + 60, 300, 25, p2KiPercent, '#2196F3', '#303F9F',
                   `Ki: ${formatNumber(player2.currentKi)}/${formatNumber(player2.stats.ki)}`, 'right');
    
    // Center divider
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, startY - 20);
    ctx.lineTo(centerX, startY + 100);
    ctx.stroke();
}

// Function để vẽ progress bar
function drawProgressBar(ctx, x, y, width, height, percent, fillColor, bgColor, text, textAlign = 'left') {
    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, width, height);
    
    // Fill
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width * (percent / 100), height);
    
    // Border
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px BeVietnamPro";
    ctx.textAlign = textAlign;
    
    const textX = textAlign === 'right' ? x + width - 10 : x + 10;
    ctx.fillText(text, textX, y + height - 6);
}

// Function để vẽ battle logs
function drawBattleLogs(ctx, logs, width, startY, endY) {
    const maxLogHeight = endY - startY;
    const lineHeight = 28;
    const maxLines = Math.floor(maxLogHeight / lineHeight);
    const displayLogs = logs.slice(-maxLines);
    
    ctx.font = '20px BeVietnamPro';
    ctx.textAlign = 'left';
    
    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(50, startY - 30, width - 100, maxLogHeight + 40);
    
    // Border
    ctx.strokeStyle = "#FFEB3B";
    ctx.lineWidth = 2;
    ctx.strokeRect(50, startY - 30, width - 100, maxLogHeight + 40);
    
    // Title
    ctx.fillStyle = "#FFEB3B";
    ctx.textAlign = 'center';
    ctx.font = '24px Saiyan';
    ctx.fillText("DIỄN BIẾN TRẬN ĐẤU", width / 2, startY);
    
    // Logs
    ctx.textAlign = 'left';
    ctx.font = '20px BeVietnamPro';
    
    let y = startY + 30;
    for (const log of displayLogs) {
        // Determine log color based on content
        if (log.includes("sử dụng")) {
            ctx.fillStyle = "#FFC107"; // Yellow for skill usage
        } else if (log.includes("sát thương")) {
            ctx.fillStyle = "#F44336"; // Red for damage
        } else if (log.includes("hồi phục")) {
            ctx.fillStyle = "#4CAF50"; // Green for healing
        } else if (log.includes("LƯỢT")) {
            ctx.fillStyle = "#2196F3"; // Blue for turn indicators
            y += 10; // Add extra space before new turns
        } else {
            ctx.fillStyle = "#FFFFFF"; // White for regular logs
        }
        
        ctx.fillText(log, 70, y);
        y += lineHeight;
    }
}

// Function để vẽ kết quả trận đấu
function drawBattleResult(ctx, player1, player2, winner, stats, width, startY) {
    // Battle result box
    ctx.fillStyle = "rgba(25, 118, 210, 0.3)";
    ctx.fillRect(50, startY, width - 100, 400);
    
    // Border
    ctx.strokeStyle = "#64B5F6";
    ctx.lineWidth = 3;
    ctx.strokeRect(50, startY, width - 100, 400);
    
    // Header
    ctx.fillStyle = "#64B5F6";
    ctx.font = '36px Saiyan';
    ctx.textAlign = 'center';
    ctx.fillText("KẾT QUẢ TRẬN ĐẤU", width / 2, startY + 50);
    
    // Winner info
    ctx.fillStyle = "#FFC107";
    ctx.font = 'bold 28px BeVietnamPro';
    ctx.fillText(`NGƯỜI THẮNG: ${winner.name}`, width / 2, startY + 100);
    
    // Status bars
    const isPlayer1Winner = winner.id === player1.id;
    const winnerObject = isPlayer1Winner ? player1 : player2;
    
    // Winner's HP and Ki
    const hpPercent = Math.min(100, Math.max(0, (stats.winnerHP / winnerObject.stats.health) * 100));
    const kiPercent = Math.min(100, Math.max(0, (stats.winnerKi / winnerObject.stats.ki) * 100));
    
    ctx.font = '22px BeVietnamPro';
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = 'left';
    ctx.fillText("HP còn lại:", width / 2 - 250, startY + 150);
    drawProgressBar(ctx, width / 2 - 150, startY + 135, 400, 25, hpPercent, '#E53935', '#5D4037',
                   `${formatNumber(stats.winnerHP)}/${formatNumber(winnerObject.stats.health)} (${Math.floor(hpPercent)}%)`);
    
    ctx.fillText("Ki còn lại:", width / 2 - 250, startY + 190);
    drawProgressBar(ctx, width / 2 - 150, startY + 175, 400, 25, kiPercent, '#2196F3', '#303F9F',
                   `${formatNumber(stats.winnerKi)}/${formatNumber(winnerObject.stats.ki)} (${Math.floor(kiPercent)}%)`);
    
    // Battle stats
    ctx.textAlign = 'center';
    ctx.fillStyle = "#FFEB3B";
    ctx.font = '24px Saiyan';
    ctx.fillText("THÔNG SỐ TRẬN ĐẤU", width / 2, startY + 240);
    
    ctx.font = '22px BeVietnamPro';
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = 'left';
    
    // Left stats
    ctx.fillText(`Tổng sát thương gây ra: ${formatNumber(stats.totalDamageDealt)}`, width / 2 - 350, startY + 280);
    ctx.fillText(`Tổng số kỹ năng sử dụng: ${stats.skillsUsed}`, width / 2 - 350, startY + 310);
    ctx.fillText(`Tổng số lượt: ${stats.totalTurns}`, width / 2 - 350, startY + 340);
    
    // Right stats
    ctx.textAlign = 'right';
    ctx.fillText(`Tổng sát thương nhận: ${formatNumber(stats.totalDamageTaken)}`, width / 2 + 350, startY + 280);
    ctx.fillText(`EXP thưởng: +${stats.expReward}`, width / 2 + 350, startY + 310);
    ctx.fillText(`Thời gian hồi PvP: 1 phút`, width / 2 + 350, startY + 340);
}

// Function để vẽ footer
function drawFooter(ctx, text, width, y) {
    ctx.fillStyle = '#757575';
    ctx.font = '18px Saiyan';
    ctx.textAlign = 'center';
    ctx.fillText(text, width / 2, y);
    
    ctx.font = '14px BeVietnamPro';
    ctx.fillText("Dragon Ball Z - PvP System", width / 2, y + 25);
}

// Hàm format số
function formatNumber(num) {
    return typeof num === 'number' ? num.toLocaleString() : '0';
}

module.exports = {
    createBattlePhase1Image,
    createBattlePhase2Image,
    createBattlePhase3Image
};