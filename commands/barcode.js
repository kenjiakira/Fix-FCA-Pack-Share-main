const bwipjs = require('bwip-js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "barcode",
    dev: "HNT",
    category: "Tools",
    info: "Tạo mã vạch từ chữ số",
    usedby: 0,
    onPrefix: true,
    usages: "[text]",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const text = target.join(" ");

        if (!text) {
            return api.sendMessage(
                "Cách dùng: barcode [chữ số]\n" +
                "Ví dụ: barcode 123456789", 
                threadID, messageID
            );
        }

        if (!/^\d+$/.test(text)) {
            return api.sendMessage(
                "⚠️ Vui lòng chỉ nhập các chữ số (0-9)",
                threadID, messageID
            );
        }

        if (text.length > 50) {
            return api.sendMessage(
                "⚠️ Độ dài tối đa là 50 ký tự!",
                threadID, messageID
            );
        }

        const tempDir = path.join(__dirname, "cache");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        
        const outputFile = path.join(tempDir, `${Date.now()}_barcode.png`);

        try {
            // Generate barcode
            await new Promise((resolve, reject) => {
                bwipjs.toBuffer({
                    bcid: 'code128',       // Barcode type
                    text: text,            // Text to encode
                    scale: 3,              // 3x scaling factor
                    height: 10,            // Bar height in millimeters
                    includetext: true,     // Show human-readable text
                    textxalign: 'center',  // Center the text
                }, (err, png) => {
                    if (err) reject(err);
                    else {
                        fs.writeFileSync(outputFile, png);
                        resolve();
                    }
                });
            });

            // Send image
            await api.sendMessage(
                {
                    body: `🏷️ Mã vạch cho: ${text}`,
                    attachment: fs.createReadStream(outputFile)
                },
                threadID,
                messageID
            );

            // Cleanup
            if (fs.existsSync(outputFile)) {
                fs.unlinkSync(outputFile);
            }

        } catch (error) {
            console.error("Barcode generation error:", error);
            return api.sendMessage(
                "❌ Đã xảy ra lỗi khi tạo mã vạch!",
                threadID, messageID
            );
        }
    }
};
