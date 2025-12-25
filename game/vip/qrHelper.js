const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createCanvas, loadImage, registerFont } = require('canvas');

// Đăng ký font chữ
try {
    const fontPath = path.join(__dirname, '../../fonts/BeVietnamPro-Medium.ttf');
    registerFont(fontPath, { family: 'BeVietnam' });
} catch (err) {
    console.error('Failed to register font:', err);
}

class QRGenerator {
    constructor() {
        this.tempDir = path.join(__dirname, '../../database/cache');
        
        // Tạo thư mục temp nếu chưa tồn tại
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Tạo hình ảnh QR cho thanh toán VIP
     * @param {Object} options - Các tùy chọn
     * @param {string} options.bankNumber - Số tài khoản ngân hàng
     * @param {string} options.bankName - Tên ngân hàng
     * @param {string} options.accountName - Tên chủ tài khoản
     * @param {number} options.amount - Số tiền thanh toán
     * @param {string} options.content - Nội dung thanh toán
     * @param {string} options.packageName - Tên gói VIP
     * @param {string} options.packageIcon - Icon của gói VIP
     * @param {boolean} options.isFamily - Có phải gói gia đình không
     * @param {boolean} options.isGroup - Có phải gói nhóm không
     * @returns {Promise<string>} - Đường dẫn đến file ảnh QR
     */
    async generateQR(options) {
        const {
            bankNumber = '109876048569',
            bankName = 'Vietinbank',  // Đảm bảo tên ngân hàng là viết tắt theo VietQR
            accountName = 'HOANG NGOC TU',
            amount,
            content,
            packageName,
            packageIcon,
            isFamily = false,
            isGroup = false
        } = options;

        try {
            // Tạo URL VietQR trực tiếp
            const vietQrUrl = `https://img.vietqr.io/image/${bankName}-${bankNumber}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`;
            
            // Tải ảnh QR trực tiếp từ API VietQR
            const qrResponse = await axios({
                method: 'GET',
                url: vietQrUrl,
                responseType: 'arraybuffer',
                headers: {
                    'Accept': 'image/png',
                    'User-Agent': 'Mozilla/5.0'
                }
            });
            
            // Lưu ảnh QR tạm thời
            const tempQrPath = path.join(this.tempDir, `temp_qr_${Date.now()}.png`);
            fs.writeFileSync(tempQrPath, Buffer.from(qrResponse.data));
            
            // Tạo canvas với kích thước 1000x1200
            const canvas = createCanvas(1000, 1200);
            const ctx = canvas.getContext('2d');

            // Vẽ nền
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, 1000, 1200);

            // Tạo gradient cho header
            const gradient = ctx.createLinearGradient(0, 0, 1000, 150);
            if (isFamily) {
                gradient.addColorStop(0, '#8E2DE2');
                gradient.addColorStop(1, '#4A00E0');
            } else if (isGroup) {
                gradient.addColorStop(0, '#11998e');
                gradient.addColorStop(1, '#38ef7d');
            } else {
                // Gradient màu dựa trên tên gói
                if (packageName?.toLowerCase().includes('bronze')) {
                    gradient.addColorStop(0, '#b8751e');
                    gradient.addColorStop(1, '#ffc87c');
                } else if (packageName?.toLowerCase().includes('silver')) {
                    gradient.addColorStop(0, '#757F9A');
                    gradient.addColorStop(1, '#D7DDE8');
                } else if (packageName?.toLowerCase().includes('gold')) {
                    gradient.addColorStop(0, '#FFD700');
                    gradient.addColorStop(1, '#FFA500');
                } else {
                    gradient.addColorStop(0, '#4e54c8');
                    gradient.addColorStop(1, '#8f94fb');
                }
            }

            // Vẽ header với gradient
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1000, 150);

            // Vẽ title
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '40px BeVietnam';
            ctx.textAlign = 'center';
            
            let title = `${packageIcon || '💎'} THANH TOÁN ${packageName || 'VIP'}`;
            if (isFamily) {
                title = '👨‍👩‍👧‍👦 THANH TOÁN GÓI GIA ĐÌNH';
            } else if (isGroup) {
                title = '👥 THANH TOÁN GÓI NHÓM';
            }
            
            ctx.fillText(title, 500, 90);

            // Vẽ khung QR
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(325, 200, 350, 350);

            // Tải ảnh QR và vẽ vào canvas
            const qrImage = await loadImage(tempQrPath);
            ctx.drawImage(qrImage, 340, 215, 320, 320);

            // Vẽ thông tin thanh toán
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '30px BeVietnam';
            ctx.textAlign = 'center';
            ctx.fillText('THÔNG TIN THANH TOÁN', 500, 600);

            // Vẽ đường kẻ
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(320, 620);
            ctx.lineTo(680, 620);
            ctx.stroke();

            // Vẽ thông tin chi tiết
            ctx.textAlign = 'left';
            ctx.font = '25px BeVietnam';
            
            // Thêm icon
            const drawTextWithIcon = (icon, text, y) => {
                ctx.fillText(`${icon} ${text}`, 200, y);
            };

            drawTextWithIcon('🏦', `Ngân hàng: ${bankName}`, 670);
            drawTextWithIcon('👤', `Chủ TK: ${accountName}`, 710);
            drawTextWithIcon('💳', `Số TK: ${bankNumber}`, 750);
            drawTextWithIcon('💰', `Số tiền: ${amount.toLocaleString('vi-VN')}đ`, 790);

            // Vẽ nội dung chuyển khoản
            ctx.fillStyle = '#FFD700';
            ctx.font = '25px BeVietnam';
            ctx.textAlign = 'center';
            ctx.fillText('NỘI DUNG CHUYỂN KHOẢN', 500, 850);

            // Vẽ khung chứa nội dung
            ctx.fillStyle = '#2d2d42';
            roundRect(ctx, 150, 870, 700, 100, 10, true);

            // Vẽ nội dung
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '30px BeVietnam';
            ctx.textAlign = 'center';
            
            // Cắt ngắn nội dung nếu quá dài
            let displayContent = content;
            if (content.length > 30) {
                displayContent = content.substring(0, 27) + '...';
            }
            
            ctx.fillText(displayContent, 500, 930);

            // Vẽ lưu ý
            ctx.fillStyle = '#FF7F50';
            ctx.font = '25px BeVietnam';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ KHÔNG THAY ĐỔI NỘI DUNG CHUYỂN KHOẢN', 500, 1020);
            ctx.fillStyle = '#a0a0a0';
            ctx.font = '22px BeVietnam';
            ctx.fillText('Hệ thống sẽ tự động kích hoạt sau khi thanh toán', 500, 1060);

            // Vẽ URL VietQR bên dưới
            ctx.fillStyle = '#8a8a8a';
            ctx.font = '16px BeVietnam';
            ctx.fillText('Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử', 500, 1100);

            // Lưu canvas thành file PNG
            const uniqueId = Date.now();
            const outputPath = path.join(this.tempDir, `vip_qr_${uniqueId}.png`);
            
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(outputPath, buffer);
            
            // Xóa file QR tạm thời
            fs.unlinkSync(tempQrPath);
            
            return outputPath;
        } catch (error) {
            console.error('Lỗi tạo QR:', error);
            return null;
        }
    }
}

// Hàm vẽ hình chữ nhật có góc bo tròn
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
        const defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (let side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
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

module.exports = new QRGenerator();