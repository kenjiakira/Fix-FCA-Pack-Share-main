const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Canvas = require('canvas');
const { createCanvas, loadImage } = Canvas;

const layoutConfig = require('./json/album/layouts.json');

function getLayoutConfig(imageCount) {
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

module.exports = {
    name: "album",
    dev: "HNT",
    info: "Ghép nhiều ảnh thành album",
    usages: "[Reply ảnh cần ghép]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, messageReply } = event;

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
                    const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
                    return await loadImage(Buffer.from(response.data));
                })
            );

            const config = getLayoutConfig(images.length);
            
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
                for (let i = 0; i < images.length && i < config.special.positions.length; i++) {
                    const pos = config.special.positions[i];
                    const img = images[i];
                    
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
                    ctx.restore();
                }
            } else {
                // Default grid layout
                let x = config.padding;
                let y = config.padding;
                let col = 0;

                for (let i = 0; i < images.length; i++) {
                    const img = images[i];
                    
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
                        body: "✅ Album đã được tạo thành công!",
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
