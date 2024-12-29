const fs = require('fs');
const path = require('path');
const axios = require('axios');
const jsQR = require('jsqr');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
    name: "qr",
    info: "Quét mã QR từ hình ảnh",
    dev: "HNT",
    usedby: 0,
    onPrefix: true,
    dmUser: false,
    usages: "Reply một ảnh có chứa mã QR để quét",
    cooldowns: 5,

    onLaunch: async function ({ api, event, actions }) {
        const { threadID, messageID, messageReply } = event;

        if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
            return await actions.reply("Vui lòng reply một ảnh có chứa mã QR để quét.", threadID, messageID);
        }

        const attachment = messageReply.attachments[0];
        if (attachment.type !== 'photo') {
            return await actions.reply("Vui lòng reply một ảnh có chứa mã QR.", threadID, messageID);
        }

        try {
            const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data);
            
            const image = await loadImage(imageBuffer);
            const canvas = createCanvas(image.width, image.height);
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(image, 0, 0);

            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'difference';
            ctx.drawImage(image, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            let code = null;
            const scales = [1, 1.5, 2, 0.75, 0.5];

            for (const scale of scales) {
                const scaledCanvas = createCanvas(canvas.width * scale, canvas.height * scale);
                const scaledCtx = scaledCanvas.getContext('2d');
                
                scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
                const scaledImageData = scaledCtx.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height);
                
                code = jsQR(scaledImageData.data, scaledImageData.width, scaledImageData.height);
                if (code) break;
            }

            if (code) {
                await actions.reply(`🔍 Nội dung mã QR:\n\n${code.data}`, threadID, messageID);
            } else {
                await actions.reply("❌ Không tìm thấy mã QR trong hình ảnh.", threadID, messageID);
            }

        } catch (error) {
            console.error('Lỗi khi quét mã QR:', error);
            await actions.reply("❌ Có lỗi xảy ra khi quét mã QR.", threadID, messageID);
        }
    }
};
