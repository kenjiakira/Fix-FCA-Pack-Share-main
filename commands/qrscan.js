const axios = require('axios');
const fs = require('fs');
const path = require('path');
const jsQR = require('jsqr');
const sharp = require('sharp');

module.exports = {
    name: "qrscan",
    dev: "HNT",
    info: "Quét mã QR từ hình ảnh",
    usages: "[Reply hình ảnh chứa mã QR]",
    usedby: 0,
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, messageReply } = event;

        if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
            return api.sendMessage("Vui lòng reply một hình ảnh chứa mã QR để quét.", threadID, messageID);
        }

        const attachment = messageReply.attachments[0];
        if (attachment.type !== 'photo') {
            return api.sendMessage("Vui lòng reply một hình ảnh.", threadID, messageID);
        }

        try {
            const response = await axios({
                url: attachment.url,
                responseType: 'arraybuffer'
            });

            const image = await sharp(response.data)
                .ensureAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true });

            const code = jsQR(
                new Uint8ClampedArray(image.data),
                image.info.width,
                image.info.height
            );

            if (code) {
                return api.sendMessage(
                    `🔍 Kết quả quét mã QR:\n\n${code.data}`,
                    threadID,
                    messageID
                );
            } else {
                return api.sendMessage(
                    "❌ Không tìm thấy mã QR trong hình ảnh hoặc mã QR không hợp lệ.",
                    threadID,
                    messageID
                );
            }

        } catch (error) {
            console.error("Lỗi khi quét mã QR:", error);
            return api.sendMessage(
                "❌ Đã xảy ra lỗi khi quét mã QR. Vui lòng thử lại với hình ảnh khác.",
                threadID,
                messageID
            );
        }
    }
};
