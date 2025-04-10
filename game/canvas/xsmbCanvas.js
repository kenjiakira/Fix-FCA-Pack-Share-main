const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

// Đăng ký font chữ
registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Bold.ttf'), { family: 'BeVietnamPro-Bold' });
registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Regular.ttf'), { family: 'BeVietnamPro-Regular' });
registerFont(path.join(__dirname, '../../fonts/Montserrat-Bold.ttf'), { family: 'Montserrat-Bold' });

/**
 * Tạo canvas cho kết quả xổ số miền Bắc
 * @param {Object} data - Dữ liệu kết quả xổ số
 * @returns {Promise<Buffer>} - Buffer chứa hình ảnh canvas
 */
async function createXSMBCanvas(data) {
    try {
        const { results, time } = data;
        
        // Tạo canvas với kích thước 950x1500
        const canvas = createCanvas(950, 1500);
        const ctx = canvas.getContext('2d');
        
        // Vẽ background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a237e');
        gradient.addColorStop(0.7, '#311b92');
        gradient.addColorStop(1, '#4a148c');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Vẽ các pattern trang trí
        await drawPatterns(ctx, canvas.width, canvas.height);
        
        // Vẽ tiêu đề
        ctx.fillStyle = '#ffffff';
        ctx.font = '45px BeVietnamPro-Bold';
        ctx.textAlign = 'center';
        ctx.fillText('KẾT QUẢ XỔ SỐ MIỀN BẮC', canvas.width / 2, 80);
        
        // Vẽ ngày tháng
        ctx.font = '30px BeVietnamPro-Regular';
        ctx.fillText(`NGÀY ${time}`, canvas.width / 2, 130);
        
        // Vẽ đường kẻ trang trí
        ctx.beginPath();
        ctx.moveTo(200, 160);
        ctx.lineTo(canvas.width - 200, 160);
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Tọa độ Y bắt đầu cho các kết quả
        let yPos = 250;
        
        // Vẽ giải Đặc biệt
        yPos = drawPrize(ctx, 'GIẢI ĐẶC BIỆT', results['ĐB'], '#ff5722', 50, yPos);
        
        // Vẽ giải Nhất
        yPos = drawPrize(ctx, 'GIẢI NHẤT', results.G1, '#ff9800', 40, yPos);
        
        // Vẽ giải Nhì
        yPos = drawPrize(ctx, 'GIẢI NHÌ', results.G2, '#ffc107', 36, yPos);
        
        // Vẽ giải Ba
        yPos = drawPrize(ctx, 'GIẢI BA', results.G3, '#8bc34a', 34, yPos);
        
        // Vẽ giải Tư
        yPos = drawPrize(ctx, 'GIẢI TƯ', results.G4, '#03a9f4', 32, yPos);
        
        // Vẽ giải Năm
        yPos = drawPrize(ctx, 'GIẢI NĂM', results.G5, '#00bcd4', 32, yPos);
        
        // Vẽ giải Sáu
        yPos = drawPrize(ctx, 'GIẢI SÁU', results.G6, '#9c27b0', 32, yPos);
        
        // Vẽ giải Bảy
        yPos = drawPrize(ctx, 'GIẢI BẢY', results.G7, '#e91e63', 32, yPos);
        
        // Vẽ chân trang
        ctx.font = '22px BeVietnamPro-Regular';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Chúc bạn may mắn!', canvas.width / 2, yPos + 60);
        
        // Vẽ logo hoặc watermark
        ctx.font = '18px Montserrat-Bold';
        ctx.fillText('FIX-FCA-AKI-2.0', canvas.width / 2, canvas.height - 30);
        
        // Chuyển canvas thành buffer
        return canvas.toBuffer('image/png');
    } catch (error) {
        console.error('Error creating XSMB canvas:', error);
        throw error;
    }
}

/**
 * Vẽ một giải thưởng
 * @param {CanvasRenderingContext2D} ctx - Context của canvas
 * @param {string} title - Tên giải
 * @param {Array<string>} numbers - Các số của giải
 * @param {string} color - Màu của giải
 * @param {number} fontSize - Kích thước font
 * @param {number} yPos - Vị trí Y
 * @returns {number} - Vị trí Y mới sau khi vẽ
 */
function drawPrize(ctx, title, numbers, color, fontSize, yPos) {
    // Vẽ tên giải
    ctx.fillStyle = '#ffffff';
    ctx.font = '30px BeVietnamPro-Bold';
    ctx.textAlign = 'center';
    ctx.fillText(title, ctx.canvas.width / 2, yPos);
    yPos += 20;
    
    // Vẽ hình sao trang trí
    ctx.beginPath();
    const starX = ctx.canvas.width / 2;
    const starY = yPos + 15;
    drawStar(ctx, starX, starY, 5, 10, 5, color);
    ctx.fillStyle = color;
    ctx.fill();
    yPos += 40;
    
    // Vẽ khung cho số
    const boxWidth = ctx.canvas.width - 100;
    const boxHeight = fontSize * 1.8 * Math.ceil(numbers.length / 2);
    const boxX = 50;
    const boxY = yPos;
    
    // Vẽ gradient background cho khung
    const boxGradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
    boxGradient.addColorStop(0, `${color}33`);
    boxGradient.addColorStop(1, `${color}11`);
    ctx.fillStyle = boxGradient;
    
    // Vẽ khung với bo góc
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 15, true);
    
    // Vẽ border cho khung
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 15, false, true);
    
    // Vẽ các số
    ctx.fillStyle = '#ffffff';
    ctx.font = `${fontSize}px BeVietnamPro-Bold`;
    
    // Kiểm tra nếu là giải nhất hoặc giải nhì thì căn giữa
    if (title === 'GIẢI NHẤT' || title === 'GIẢI NHÌ') {
        // Căn giữa các số
        const centerX = ctx.canvas.width / 2;
        for (let i = 0; i < numbers.length; i++) {
            const y = boxY + 50 + i * (fontSize + 20);
            
            ctx.fillText(numbers[i], centerX, y);
            
            // Vẽ hiệu ứng glow cho số
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.fillText(numbers[i], centerX, y);
            ctx.shadowBlur = 0;
        }
    } else {
        // Cho các giải khác, giữ nguyên cách vẽ hiện tại với 2 cột
        const numPerRow = 2;
        const spacingX = boxWidth / numPerRow;
        
        for (let i = 0; i < numbers.length; i++) {
            const col = i % numPerRow;
            const row = Math.floor(i / numPerRow);
            
            const x = boxX + (col + 0.5) * spacingX;
            const y = boxY + 50 + row * (fontSize + 20);
            
            ctx.fillText(numbers[i], x, y);
            
            // Vẽ hiệu ứng glow cho số
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.fillText(numbers[i], x, y);
            ctx.shadowBlur = 0;
        }
    }
    
    return yPos + boxHeight + 30;
}
/**
 * Vẽ hình ngôi sao
 * @param {CanvasRenderingContext2D} ctx - Context của canvas
 * @param {number} x - Tọa độ X trung tâm
 * @param {number} y - Tọa độ Y trung tâm
 * @param {number} spikes - Số cánh sao
 * @param {number} outerRadius - Bán kính ngoài
 * @param {number} innerRadius - Bán kính trong
 * @param {string} color - Màu sắc
 */
function drawStar(ctx, x, y, spikes, outerRadius, innerRadius, color) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(x, y - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
        rot += step;
        
        ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
        rot += step;
    }
    
    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

/**
 * Vẽ hình chữ nhật có góc bo tròn
 * @param {CanvasRenderingContext2D} ctx - Context của canvas
 * @param {number} x - Tọa độ X
 * @param {number} y - Tọa độ Y
 * @param {number} width - Chiều rộng
 * @param {number} height - Chiều cao
 * @param {number} radius - Bán kính bo góc
 * @param {boolean} fill - Có tô màu không
 * @param {boolean} stroke - Có vẽ viền không
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'undefined') radius = 5;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

/**
 * Vẽ các họa tiết trang trí
 * @param {CanvasRenderingContext2D} ctx - Context của canvas
 * @param {number} width - Chiều rộng canvas
 * @param {number} height - Chiều cao canvas
 */
async function drawPatterns(ctx, width, height) {
    // Vẽ các họa tiết trang trí
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 3 + 1;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
        ctx.fill();
    }
    
    // Vẽ các hình trang trí ở góc
    for (let i = 0; i < 5; i++) {
        drawStar(ctx, 50 + i * 20, 50 + i * 10, 5, 10, 5, `rgba(255, 193, 7, ${0.2 - i * 0.03})`);
        drawStar(ctx, width - 50 - i * 20, 50 + i * 10, 5, 10, 5, `rgba(255, 193, 7, ${0.2 - i * 0.03})`);
        drawStar(ctx, 50 + i * 20, height - 50 - i * 10, 5, 10, 5, `rgba(255, 193, 7, ${0.2 - i * 0.03})`);
        drawStar(ctx, width - 50 - i * 20, height - 50 - i * 10, 5, 10, 5, `rgba(255, 193, 7, ${0.2 - i * 0.03})`);
    }
}

module.exports = { createXSMBCanvas };