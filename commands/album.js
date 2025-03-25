const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Canvas = require('canvas');
const { createCanvas, loadImage } = Canvas;

const layoutConfig = require('./json/album/layouts.json');

function getLayoutConfig(imageCount, layout = 'auto') {
    if (layout !== 'auto' && layoutConfig.layouts[layout]) {
        return {
            ...layoutConfig.layouts[layout],
            effects: layoutConfig.effects,
            optimization: layoutConfig.optimization
        };
    }
    
    const config = layoutConfig.layouts[imageCount.toString()] || layoutConfig.layouts.default;
    return {
        ...config,
        effects: layoutConfig.effects,
        optimization: layoutConfig.optimization
    };
}

function applyEffects(ctx, x, y, width, height, effects) {
    // Apply shadow
    if (effects.shadow) {
        ctx.shadowColor = effects.shadow.color;
        ctx.shadowBlur = effects.shadow.blur;
        ctx.shadowOffsetX = effects.shadow.offsetX;
        ctx.shadowOffsetY = effects.shadow.offsetY;
    }

    // Apply corner radius
    if (effects.cornerRadius) {
        ctx.beginPath();
        ctx.moveTo(x + effects.cornerRadius, y);
        ctx.lineTo(x + width - effects.cornerRadius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + effects.cornerRadius);
        ctx.lineTo(x + width, y + height - effects.cornerRadius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - effects.cornerRadius, y + height);
        ctx.lineTo(x + effects.cornerRadius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - effects.cornerRadius);
        ctx.lineTo(x, y + effects.cornerRadius);
        ctx.quadraticCurveTo(x, y, x + effects.cornerRadius, y);
        ctx.closePath();
        ctx.clip();
    }
}

// New function to apply filters to images
function applyFilter(ctx, x, y, width, height, filter) {
    if (!filter || filter === 'none') return;
    
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    
    switch (filter) {
        case 'grayscale':
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg;
                data[i + 1] = avg;
                data[i + 2] = avg;
            }
            break;
        case 'sepia':
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
            }
            break;
        case 'invert':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
            break;
    }
    
    ctx.putImageData(imageData, x, y);
}

// New function to add text to images
function addCaption(ctx, text, x, y, width) {
    if (!text) return;
    
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Add background shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Word wrap and position text
    const words = text.split(' ');
    let line = '';
    let lineY = y + 10;
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width - 20 && n > 0) {
            ctx.strokeText(line, x + width/2, lineY);
            ctx.fillText(line, x + width/2, lineY);
            line = words[n] + ' ';
            lineY += 30;
        } else {
            line = testLine;
        }
    }
    
    ctx.strokeText(line, x + width/2, lineY);
    ctx.fillText(line, x + width/2, lineY);
    ctx.restore();
}

module.exports = {
    name: "album",
    dev: "HNT",
    category: "Media",
    info: "Ghép nhiều ảnh thành album với nhiều tùy chọn",
    usages: "[bg: <màu>] [layout: <kiểu>] [filter: <bộ lọc>] [caption: <chữ>] [Reply ảnh cần ghép]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, messageReply } = event;
        
        // Parse command arguments
        let backgroundColor = '#121212';
        let layoutType = 'auto';
        let filter = 'none';
        let caption = '';
        
        // Process command arguments
        for (const arg of target) {
            if (arg.startsWith('bg:')) {
                backgroundColor = arg.substring(3).trim() || backgroundColor;
            } else if (arg.startsWith('layout:')) {
                layoutType = arg.substring(7).trim() || layoutType;
            } else if (arg.startsWith('filter:')) {
                filter = arg.substring(7).trim() || filter;
            } else if (arg.startsWith('caption:')) {
                caption = arg.substring(8).trim() || caption;
            }
        }

        if (!messageReply || !messageReply.attachments || messageReply.attachments.length < 2) {
            return api.sendMessage("Vui lòng reply nhiều ảnh để ghép album (ít nhất 2 ảnh).", threadID, messageID);
        }

        const attachments = messageReply.attachments.filter(att => att.type === 'photo');
        if (attachments.length < 2) {
            return api.sendMessage("Cần ít nhất 2 ảnh để tạo album.", threadID, messageID);
        }

        api.sendMessage("⏳ Đang xử lý ghép ảnh...", threadID, messageID);

        try {
            const images = await Promise.all(
                attachments.map(async (attachment) => {
                    try {
                        const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
                        return await loadImage(Buffer.from(response.data));
                    } catch (err) {
                        console.error("Error loading image:", err);
                        return null;
                    }
                })
            );
            
            // Filter out any images that failed to load
            const validImages = images.filter(img => img !== null);
            
            if (validImages.length < 2) {
                return api.sendMessage("❌ Không đủ ảnh hợp lệ để tạo album (cần ít nhất 2 ảnh).", threadID, messageID);
            }

            const config = getLayoutConfig(validImages.length, layoutType);
            
            // Override background color if specified
            if (backgroundColor) {
                config.background = backgroundColor;
            }
            
            // Calculate dimensions
            const imageSize = Math.min(
                Math.floor((config.maxSize - config.padding * (config.cols + 1)) / config.cols),
                Math.floor((config.maxSize - config.padding * (config.rows + 1)) / config.rows)
            );

            const canvasWidth = imageSize * config.cols + config.padding * (config.cols + 1);
            const canvasHeight = imageSize * config.rows + config.padding * (config.rows + 1);

            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');

            // Fill background
            ctx.fillStyle = config.background;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Draw images based on special layout or default grid
            if (config.special) {
                for (let i = 0; i < validImages.length && i < config.special.positions.length; i++) {
                    const pos = config.special.positions[i];
                    const img = validImages[i];
                    
                    const x = config.padding + (pos.x * (imageSize + config.padding));
                    const y = config.padding + (pos.y * (imageSize + config.padding));
                    const width = pos.w * imageSize + (pos.w - 1) * config.padding;
                    const height = pos.h * imageSize + (pos.h - 1) * config.padding;

                    ctx.save();
                    applyEffects(ctx, x, y, width, height, config.effects);
                    
                    const aspectRatio = img.width / img.height;
                    let drawWidth = width;
                    let drawHeight = height;

                    if (aspectRatio > width/height) {
                        drawHeight = width / aspectRatio;
                    } else {
                        drawWidth = height * aspectRatio;
                    }

                    const offsetX = (width - drawWidth) / 2;
                    const offsetY = (height - drawHeight) / 2;

                    ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
                    
                    // Apply filter to this image area
                    applyFilter(ctx, x, y, width, height, filter);
                    
                    // Add caption if this is the main/first image
                    if (i === 0 && caption) {
                        addCaption(ctx, caption, x, y + height - 80, width);
                    }
                    
                    ctx.restore();
                }
            } else {
                // Default grid layout
                let x = config.padding;
                let y = config.padding;
                let col = 0;

                for (let i = 0; i < validImages.length; i++) {
                    const img = validImages[i];
                    
                    ctx.save();
                    applyEffects(ctx, x, y, imageSize, imageSize, config.effects);

                    const aspectRatio = img.width / img.height;
                    let drawWidth = imageSize;
                    let drawHeight = imageSize;

                    if (aspectRatio > 1) {
                        drawHeight = drawWidth / aspectRatio;
                    } else {
                        drawWidth = drawHeight * aspectRatio;
                    }

                    const offsetX = (imageSize - drawWidth) / 2;
                    const offsetY = (imageSize - drawHeight) / 2;

                    ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
                    
                    // Apply filter to this image
                    applyFilter(ctx, x, y, imageSize, imageSize, filter);
                    
                    // Add caption to first image only
                    if (i === 0 && caption) {
                        addCaption(ctx, caption, x, y + imageSize - 80, imageSize);
                    }
                    
                    ctx.restore();

                    col++;
                    if (col >= config.cols) {
                        col = 0;
                        x = config.padding;
                        y += imageSize + config.padding;
                    } else {
                        x += imageSize + config.padding;
                    }
                }
            }

            // Save with optimization settings
            const outputPath = path.join(__dirname, 'cache', `album_${Date.now()}.${config.optimization.format}`);
            const out = fs.createWriteStream(outputPath);
            
            if (config.optimization.format === 'jpg') {
                const stream = canvas.createJPEGStream({
                    quality: config.optimization.quality,
                    chromaSubsampling: true
                });
                stream.pipe(out);
            } else {
                const stream = canvas.createPNGStream();
                stream.pipe(out);
            }

            out.on('finish', () => {
                api.sendMessage(
                    {
                        body: `✅ Album đã được tạo thành công!\n${filter !== 'none' ? `• Bộ lọc: ${filter}\n` : ''}${caption ? `• Chú thích: "${caption}"\n` : ''}• Bố cục: ${layoutType !== 'auto' ? layoutType : 'tự động'}`,
                        attachment: fs.createReadStream(outputPath)
                    },
                    threadID,
                    () => fs.unlinkSync(outputPath),
                    messageID
                );
            });

        } catch (error) {
            console.error(error);
            api.sendMessage("❌ Có lỗi xảy ra khi ghép ảnh: " + error.message, threadID, messageID);
        }
    }
};
